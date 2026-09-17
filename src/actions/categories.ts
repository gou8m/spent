"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";

export interface ActionResult {
  error?: string;
}

export async function createCategoryAction(input: CategoryInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };

  const existing = await prisma.category.findFirst({
    where: { userId, name: parsed.data.name, type: parsed.data.type },
  });
  if (existing) return { error: "A category with this name already exists" };

  const parentResult = await resolveParentId(userId, parsed.data.parentId, parsed.data.type, null);
  if (parentResult?.error) return { error: parentResult.error };

  const count = await prisma.category.count({ where: { userId, type: parsed.data.type } });
  await prisma.category.create({
    data: { userId, name: parsed.data.name, type: parsed.data.type, icon: parsed.data.icon, color: parsed.data.color, parentId: parentResult?.id ?? null, sortOrder: count },
  });

  revalidatePath("/categories");
  revalidatePath("/profile/categories");
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
    where: { userId, name: parsed.data.name, type: parsed.data.type, NOT: { id } },
  });
  if (duplicate) return { error: "A category with this name already exists" };

  const parentResult = await resolveParentId(userId, parsed.data.parentId, parsed.data.type, id);
  if (parentResult?.error) return { error: parentResult.error };

  await prisma.category.update({
    where: { id },
    data: { name: parsed.data.name, type: parsed.data.type, icon: parsed.data.icon, color: parsed.data.color, parentId: parentResult?.id ?? null },
  });

  revalidatePath("/categories");
  revalidatePath("/profile/categories");
  return {};
}

/** Hard-deletes only when nothing references the category; otherwise archives it. */
export async function deleteCategoryAction(id: string): Promise<ActionResult & { archived?: boolean }> {
  const userId = await requireUserId();
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) return { error: "Category not found" };

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
    await prisma.category.update({ where: { id }, data: { isArchived: true } });
    revalidatePath("/categories");
    return { archived: true };
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
  return {};
}
