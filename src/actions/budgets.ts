"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { budgetSchema, type BudgetInput } from "@/lib/validations/budget";
import { toMinorUnits } from "@/lib/money";
import { getBudgets } from "@/lib/data/budgets";

export interface ActionResult {
  error?: string;
}

export async function createBudgetAction(input: BudgetInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { currency: true } });
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };
  const data = parsed.data;

  if (data.categoryIds.length > 0) {
    const count = await prisma.category.count({ where: { id: { in: data.categoryIds }, userId } });
    if (count !== data.categoryIds.length) return { error: "One or more categories are invalid" };
  }

  await prisma.budget.create({
    data: {
      userId,
      name: data.name,
      amount: toMinorUnits(data.amount, user.currency),
      period: data.period,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      rollover: data.rollover,
      color: data.color,
      icon: data.icon,
      categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) },
    },
  });

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return {};
}

export async function updateBudgetAction(id: string, input: BudgetInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { currency: true } });
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };
  const data = parsed.data;

  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) return { error: "Budget not found" };

  if (data.categoryIds.length > 0) {
    const count = await prisma.category.count({ where: { id: { in: data.categoryIds }, userId } });
    if (count !== data.categoryIds.length) return { error: "One or more categories are invalid" };
  }

  await prisma.$transaction([
    prisma.budgetCategory.deleteMany({ where: { budgetId: id } }),
    prisma.budget.update({
      where: { id },
      data: {
        name: data.name,
        amount: toMinorUnits(data.amount, user.currency),
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        rollover: data.rollover,
        color: data.color,
        icon: data.icon,
        categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) },
      },
    }),
  ]);

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return {};
}

export async function archiveBudgetAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) return { error: "Budget not found" };

  await prisma.budget.update({ where: { id }, data: { isArchived: true } });
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return {};
}

/** Brings an archived budget back into the active list. */
export async function restoreBudgetAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) return { error: "Budget not found" };

  await prisma.budget.update({ where: { id }, data: { isArchived: false } });
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteBudgetAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) return { error: "Budget not found" };

  await prisma.budget.delete({ where: { id } });
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return {};
}

/** The budget detail screen's "In this budget" list — every COMPLETED expense in
 * this budget's categories (parent categories roll up their children, same as the
 * spend total itself) within the given period, in the budget's own currency only. */
export async function getBudgetTransactionsAction(budgetId: string, periodStart: Date, periodEnd: Date, currency: string) {
  const userId = await requireUserId();
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
    include: { categories: { include: { category: { include: { children: true } } } } },
  });
  if (!budget) return [];

  const categoryIds = budget.categories.flatMap((c) => [c.categoryId, ...c.category.children.map((child) => child.id)]);

  return prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      status: "COMPLETED",
      currency,
      date: { gte: periodStart, lte: periodEnd },
      ...(categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
    },
    include: { category: true, account: true },
    orderBy: { date: "desc" },
  });
}

export interface BudgetImpact {
  budgetId: string;
  name: string;
  /** Minor units of the user's primary currency. */
  limit: number;
  spentBefore: number;
  spentAfter: number;
  percentAfter: number;
  overBy: number;
}

/** Warn from this share of a budget onwards. */
const WARN_THRESHOLD_PERCENT = 80;

/**
 * "What would this expense do to my budgets?" — for the add-transaction sheet's live
 * warning. Looks at every active budget that covers the chosen category (an empty
 * category list covers everything; a budget on a parent covers its subcategories) and
 * whose current period contains the transaction's date, and returns those the expense
 * would take to 80% or beyond. When editing, the transaction's own previous amount is
 * taken back out first so it is not counted twice.
 */
export async function getBudgetImpactAction(input: {
  categoryId: string;
  /** Major units, as typed in the form. */
  amount: number;
  date: string;
  currency: string;
  excludeTransactionId?: string;
}): Promise<BudgetImpact[]> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { currency: true } });
  // Budgets are tracked in the primary currency only, same rule getBudgets uses.
  if (input.currency !== user.currency || !(input.amount > 0)) return [];

  const when = new Date(input.date);
  if (Number.isNaN(when.getTime())) return [];

  const category = await prisma.category.findFirst({ where: { id: input.categoryId, userId }, select: { id: true, parentId: true } });
  if (!category) return [];

  const minor = toMinorUnits(input.amount, user.currency);
  const budgets = await getBudgets(userId, user.currency, { referenceDate: when });
  const previous = input.excludeTransactionId
    ? await prisma.transaction.findFirst({
        where: { id: input.excludeTransactionId, userId, type: "EXPENSE", status: "COMPLETED", currency: user.currency },
        select: { amount: true, date: true, categoryId: true },
      })
    : null;

  const impacts: BudgetImpact[] = [];
  for (const budget of budgets) {
    const covered = (id: string | null | undefined) => {
      if (budget.categories.length === 0) return true;
      if (!id) return false;
      return budget.categories.some((c) => c.categoryId === id || c.category.children.some((child) => child.id === id));
    };
    if (!covered(category.id)) continue;
    if (when < budget.periodStart || when > budget.periodEnd) continue;

    let spentBefore = budget.spent;
    if (previous && previous.date >= budget.periodStart && previous.date <= budget.periodEnd && covered(previous.categoryId)) {
      spentBefore -= previous.amount;
    }
    const spentAfter = spentBefore + minor;
    const percentAfter = budget.amount === 0 ? 0 : (spentAfter / budget.amount) * 100;
    if (percentAfter < WARN_THRESHOLD_PERCENT) continue;

    impacts.push({
      budgetId: budget.id,
      name: budget.name,
      limit: budget.amount,
      spentBefore,
      spentAfter,
      percentAfter,
      overBy: Math.max(0, spentAfter - budget.amount),
    });
  }
  return impacts.sort((a, b) => b.percentAfter - a.percentAfter);
}
