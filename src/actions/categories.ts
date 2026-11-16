"use server";

import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { getBudgets } from "@/lib/data/budgets";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  EMERGENCY_FUND_CATEGORY_NAME,
  LOAN_INCOME_CATEGORY_NAME,
  LOAN_REPAYMENT_EXPENSE_CATEGORY_NAME,
  LOAN_REPAYMENT_INCOME_CATEGORY_NAME,
  OTHER_TRANSFER_CATEGORY_NAME,
  type DefaultCategorySeed,
} from "@/lib/constants";

export interface ActionResult {
  error?: string;
}

/** Categories other features find by name (loans, "other transfer", the emergency-fund
 * link). Removing, merging or archiving one would silently break that feature, so those
 * actions refuse. Renaming/recolouring is still allowed — the lookups key off the name
 * at the time, same as before. */
const SYSTEM_CATEGORY_NAMES = [
  LOAN_INCOME_CATEGORY_NAME,
  LOAN_REPAYMENT_EXPENSE_CATEGORY_NAME,
  LOAN_REPAYMENT_INCOME_CATEGORY_NAME,
  OTHER_TRANSFER_CATEGORY_NAME,
  EMERGENCY_FUND_CATEGORY_NAME,
].map((n) => n.toLowerCase());

function isSystemCategory(name: string) {
  return SYSTEM_CATEGORY_NAMES.includes(name.trim().toLowerCase());
}

const SYSTEM_MESSAGE = (name: string) => `"${name}" is used by loans, transfers or the emergency fund, so it can't be removed or merged.`;

function refresh() {
  revalidatePath("/categories");
  revalidatePath("/profile/categories");
}

export async function createCategoryAction(input: CategoryInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };

  const existing = await prisma.category.findFirst({
    where: { userId, name: { equals: parsed.data.name, mode: "insensitive" }, type: parsed.data.type },
  });
  if (existing) return { error: existing.isArchived ? "An archived category with this name exists. Restore it instead." : "A category with this name already exists" };

  const parentResult = await resolveParentId(userId, parsed.data.parentId, parsed.data.type, null);
  if (parentResult?.error) return { error: parentResult.error };

  const count = await prisma.category.count({ where: { userId, type: parsed.data.type, parentId: parentResult?.id ?? null } });
  await prisma.category.create({
    data: { userId, name: parsed.data.name, type: parsed.data.type, icon: parsed.data.icon, color: parsed.data.color, parentId: parentResult?.id ?? null, sortOrder: count },
  });

  refresh();
  return {};
}

/** Shared by create/update: validates an optional parent id against the depth-1 rule
 * (the parent can't itself be a subcategory) and matching type, and — only on update,
 * where `excludeId` is the category being edited — that it isn't the category's own
 * id and that the category being edited doesn't already have children of its own
 * (which would make it invalid as someone else's child). Returns `undefined` for "no
 * parent requested", `{ id }` for a validated parent, or `{ error }` to bail out with. */
async function resolveParentId(
  userId: string,
  rawParentId: string | undefined,
  type: "INCOME" | "EXPENSE",
  excludeId: string | null,
): Promise<{ id?: string; error?: string } | undefined> {
  if (!rawParentId) return undefined;
  if (excludeId) {
    if (rawParentId === excludeId) return { error: "A category can't be its own parent" };
    const childCount = await prisma.category.count({ where: { parentId: excludeId } });
    if (childCount > 0) return { error: "This category has its own subcategories, so it can't be nested under another" };
  }
  const parent = await prisma.category.findFirst({ where: { id: rawParentId, userId } });
  if (!parent) return { error: "Parent category not found" };
  if (parent.type !== type) return { error: "A subcategory must match its parent's type" };
  if (parent.parentId) return { error: "Can't nest a subcategory under another subcategory" };
  return { id: parent.id };
}

export async function updateCategoryAction(id: string, input: CategoryInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };

  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) return { error: "Category not found" };

  const duplicate = await prisma.category.findFirst({
    where: { userId, name: { equals: parsed.data.name, mode: "insensitive" }, type: parsed.data.type, NOT: { id } },
  });
  if (duplicate) return { error: "A category with this name already exists" };

  const parentResult = await resolveParentId(userId, parsed.data.parentId, parsed.data.type, id);
  if (parentResult?.error) return { error: parentResult.error };

  await prisma.category.update({
    where: { id },
    data: { name: parsed.data.name, type: parsed.data.type, icon: parsed.data.icon, color: parsed.data.color, parentId: parentResult?.id ?? null },
  });

  refresh();
  return {};
}

/** Hard-deletes only when nothing references the category; otherwise archives it. */
export async function deleteCategoryAction(id: string): Promise<ActionResult & { archived?: boolean }> {
  const userId = await requireUserId();
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) return { error: "Category not found" };
  if (isSystemCategory(category.name)) return { error: SYSTEM_MESSAGE(category.name) };

  const [txCount, budgetCount, recurringCount, childCount] = await Promise.all([
    prisma.transaction.count({ where: { categoryId: id } }),
    prisma.budgetCategory.count({ where: { categoryId: id } }),
    prisma.recurringTransaction.count({ where: { categoryId: id } }),
    // A parent with subcategories archives instead of hard-deleting too — the FK from
    // Transaction.categoryId has no cascade, so cascading the delete down to children
    // that are themselves in use would fail loudly (or, if none of them are in use,
    // would silently take otherwise-fine subcategories down with the parent).
    prisma.category.count({ where: { parentId: id } }),
  ]);

  if (txCount + budgetCount + recurringCount + childCount > 0) {
    await prisma.category.updateMany({ where: { OR: [{ id }, { parentId: id }], userId }, data: { isArchived: true } });
    refresh();
    return { archived: true };
  }

  await prisma.category.delete({ where: { id } });
  refresh();
  return {};
}

/** Archive (hides it from pickers, keeps all history) or restore a category. Archiving a
 * parent archives its subcategories too; restoring a subcategory restores its parent. */
export async function setCategoryArchivedAction(id: string, archived: boolean): Promise<ActionResult> {
  const userId = await requireUserId();
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) return { error: "Category not found" };
  if (archived && isSystemCategory(category.name)) return { error: SYSTEM_MESSAGE(category.name) };

  if (archived) {
    await prisma.category.updateMany({ where: { userId, OR: [{ id }, { parentId: id }] }, data: { isArchived: true } });
  } else {
    await prisma.category.updateMany({
      where: { userId, OR: [{ id }, { id: category.parentId ?? "__none__" }, { parentId: id }] },
      data: { isArchived: false },
    });
  }
  refresh();
  return {};
}

/** Folds one category into another: every transaction, recurring rule and budget that
 * used the source now uses the target, its subcategories move across, then the source is
 * removed. This is the "I have two of the same thing" fix, and also how an in-use category
 * is deleted without losing history. */
export async function mergeCategoryAction(sourceId: string, targetId: string): Promise<ActionResult & { moved?: number }> {
  const userId = await requireUserId();
  if (sourceId === targetId) return { error: "Pick a different category to merge into" };

  const [source, target] = await Promise.all([
    prisma.category.findFirst({ where: { id: sourceId, userId }, include: { children: { select: { id: true } } } }),
    prisma.category.findFirst({ where: { id: targetId, userId } }),
  ]);
  if (!source || !target) return { error: "Category not found" };
  if (source.type !== target.type) return { error: "Income and expense categories can't be merged" };
  if (isSystemCategory(source.name)) return { error: SYSTEM_MESSAGE(source.name) };
  if (target.parentId === source.id) return { error: "Can't merge a category into one of its own subcategories" };
  if (source.children.length > 0 && target.parentId) return { error: "Choose a top-level category: this one has subcategories that need a top-level home" };

  const budgetRows = await prisma.budgetCategory.findMany({ where: { categoryId: source.id } });
  const targetRows = await prisma.budgetCategory.findMany({
    where: { categoryId: target.id, budgetId: { in: budgetRows.map((r) => r.budgetId) } },
  });
  const targetByBudget = new Map(targetRows.map((r) => [r.budgetId, r]));

  const ops = [
    prisma.transaction.updateMany({ where: { categoryId: source.id }, data: { categoryId: target.id } }),
    prisma.recurringTransaction.updateMany({ where: { categoryId: source.id }, data: { categoryId: target.id } }),
    // A budget that already covers the target just drops the source row (limits add up);
    // otherwise the row is re-pointed at the target.
    ...budgetRows.flatMap((row) => {
      const existing = targetByBudget.get(row.budgetId);
      if (!existing) return [prisma.budgetCategory.update({ where: { id: row.id }, data: { categoryId: target.id } })];
      const limit = row.limit != null && existing.limit != null ? row.limit + existing.limit : (existing.limit ?? row.limit);
      return [
        prisma.budgetCategory.update({ where: { id: existing.id }, data: { limit } }),
        prisma.budgetCategory.delete({ where: { id: row.id } }),
      ];
    }),
    prisma.category.updateMany({ where: { parentId: source.id }, data: { parentId: target.id } }),
    prisma.category.delete({ where: { id: source.id } }),
  ];
  const results = await prisma.$transaction(ops);
  const moved = (results[0] as { count: number }).count;

  refresh();
  revalidatePath("/budgets");
  revalidatePath("/transactions");
  return { moved };
}

/** Moves a category one step up or down among its siblings (same type and parent). */
export async function moveCategoryAction(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const userId = await requireUserId();
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) return { error: "Category not found" };

  const siblings = await prisma.category.findMany({
    where: { userId, type: category.type, parentId: category.parentId, isArchived: false },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const index = siblings.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= siblings.length) return {};

  // Rewrite the whole sibling list as 0..n so ties and gaps from older data cannot cause a no-op swap.
  const order = siblings.map((s) => s.id);
  [order[index], order[swapWith]] = [order[swapWith], order[index]];
  await prisma.$transaction(order.map((cid, i) => prisma.category.update({ where: { id: cid }, data: { sortOrder: i } })));

  refresh();
  return {};
}

// ---------------------------------------------------------------- insights

export interface CategoryInsights {
  currency: string;
  thisMonth: number;
  lastMonth: number;
  months: { label: string; amount: number }[];
  transactionCount: number;
  budgets: { id: string; name: string; spent: number; limit: number; percent: number }[];
  recent: { id: string; title: string; amount: number; currency: string; date: string; account: string }[];
}

/** Everything the category detail sheet shows, for the category and its subcategories
 * together (a parent's figures include what its children spent, the same roll-up
 * budgets and reports use). Spend is summed in the primary currency only. */
export async function getCategoryInsightsAction(id: string): Promise<CategoryInsights | { error: string }> {
  const userId = await requireUserId();
  const [user, category] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { currency: true } }),
    prisma.category.findFirst({ where: { id, userId }, include: { children: { select: { id: true } } } }),
  ]);
  if (!category) return { error: "Category not found" };

  const ids = [category.id, ...category.children.map((c) => c.id)];
  const now = new Date();
  const sumFor = async (monthsAgo: number) => {
    const month = subMonths(now, monthsAgo);
    const agg = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: { in: ids },
        status: "COMPLETED",
        currency: user.currency,
        date: { gte: startOfMonth(month), lte: endOfMonth(month) },
      },
      _sum: { amount: true },
    });
    return { label: format(month, "MMM"), amount: agg._sum.amount ?? 0 };
  };

  const [months, transactionCount, recent, budgets] = await Promise.all([
    Promise.all([5, 4, 3, 2, 1, 0].map(sumFor)),
    prisma.transaction.count({ where: { userId, categoryId: { in: ids } } }),
    prisma.transaction.findMany({
      where: { userId, categoryId: { in: ids } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { account: { select: { name: true } } },
    }),
    getBudgets(userId, user.currency),
  ]);

  const covering = budgets.filter((b) => b.categories.some((c) => ids.includes(c.categoryId) || c.category.children.some((ch) => ids.includes(ch.id))));

  return {
    currency: user.currency,
    thisMonth: months[5].amount,
    lastMonth: months[4].amount,
    months,
    transactionCount,
    budgets: covering.map((b) => ({ id: b.id, name: b.name, spent: b.spent, limit: b.amount, percent: b.rawPercentUsed })),
    recent: recent.map((t) => ({
      id: t.id,
      title: t.title,
      amount: t.amount,
      currency: t.currency,
      date: t.date.toISOString(),
      account: t.account.name,
    })),
  };
}

// ----------------------------------------------------------- suggested set

export interface SuggestedCategory {
  key: string;
  type: "INCOME" | "EXPENSE";
  name: string;
  icon: string;
  color: string;
  parent?: string;
}

function flattenDefaults(type: "INCOME" | "EXPENSE", seeds: DefaultCategorySeed[]): SuggestedCategory[] {
  return seeds.flatMap((seed) => [
    { key: `${type}:${seed.name}`, type, name: seed.name, icon: seed.icon, color: seed.color },
    ...(seed.children ?? []).map((child) => ({ key: `${type}:${seed.name}>${child.name}`, type, name: child.name, icon: child.icon, color: child.color, parent: seed.name })),
  ]);
}

/** The standard categories this user does not have yet (matched by name, including
 * archived ones, so nothing they deliberately removed is offered if it is just archived). */
export async function getSuggestedCategoriesAction(): Promise<SuggestedCategory[]> {
  const userId = await requireUserId();
  const existing = await prisma.category.findMany({ where: { userId }, select: { name: true, type: true } });
  const have = new Set(existing.map((c) => `${c.type}:${c.name.toLowerCase()}`));
  return [...flattenDefaults("EXPENSE", DEFAULT_EXPENSE_CATEGORIES), ...flattenDefaults("INCOME", DEFAULT_INCOME_CATEGORIES)].filter(
    (c) => !have.has(`${c.type}:${c.name.toLowerCase()}`),
  );
}

/** Creates the chosen suggested categories (re-derived server-side from the defaults, so
 * only known names/icons/colours are ever written). A chosen subcategory brings its parent
 * along if the user does not have it. */
export async function addSuggestedCategoriesAction(keys: string[]): Promise<ActionResult & { added?: number }> {
  const userId = await requireUserId();
  const wanted = new Set(keys);
  const missing = await getSuggestedCategoriesAction();
  const chosen = missing.filter((c) => wanted.has(c.key));
  if (chosen.length === 0) return { added: 0 };

  const all = await prisma.category.findMany({ where: { userId }, select: { id: true, name: true, type: true, parentId: true } });
  const idByName = new Map(all.map((c) => [`${c.type}:${c.name.toLowerCase()}`, c.id]));
  const nextOrder = new Map<string, number>();
  const orderFor = async (type: string, parentId: string | null) => {
    const k = `${type}:${parentId}`;
    if (!nextOrder.has(k)) nextOrder.set(k, await prisma.category.count({ where: { userId, type, parentId } }));
    const n = nextOrder.get(k)!;
    nextOrder.set(k, n + 1);
    return n;
  };

  let added = 0;
  // Parents first, so children can point at them.
  for (const c of [...chosen.filter((c) => !c.parent), ...chosen.filter((c) => c.parent)]) {
    let parentId: string | null = null;
    if (c.parent) {
      parentId = idByName.get(`${c.type}:${c.parent.toLowerCase()}`) ?? null;
      if (!parentId) {
        const seed = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].find((s) => s.name === c.parent);
        const created = await prisma.category.create({
          data: { userId, name: c.parent, type: c.type, icon: seed?.icon ?? "circle", color: seed?.color ?? "slate", sortOrder: await orderFor(c.type, null) },
        });
        idByName.set(`${c.type}:${c.parent.toLowerCase()}`, created.id);
        parentId = created.id;
        added++;
      }
    }
    const created = await prisma.category.create({
      data: { userId, name: c.name, type: c.type, icon: c.icon, color: c.color, parentId, sortOrder: await orderFor(c.type, parentId) },
    });
    idByName.set(`${c.type}:${c.name.toLowerCase()}`, created.id);
    added++;
  }

  refresh();
  return { added };
}
