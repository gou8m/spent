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

  const count = await prisma.category.count({ where: { userId, type: parsed.data.type } });
  await prisma.category.create({
    data: { userId, ...parsed.data, sortOrder: count },
  });

  revalidatePath("/categories");
  revalidatePath("/profile/categories");
  return {};
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

  await prisma.category.update({ where: { id }, data: parsed.data });

  revalidatePath("/categories");
  revalidatePath("/profile/categories");
  return {};
}

/** Hard-deletes only when nothing references the category; otherwise archives it. */
export async function deleteCategoryAction(id: string): Promise<ActionResult & { archived?: boolean }> {
  const userId = await requireUserId();
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) return { error: "Category not found" };

  const [txCount, budgetCount, recurringCount] = await Promise.all([
    prisma.transaction.count({ where: { categoryId: id } }),
    prisma.budgetCategory.count({ where: { categoryId: id } }),
    prisma.recurringTransaction.count({ where: { categoryId: id } }),
  ]);

  if (txCount + budgetCount + recurringCount > 0) {
    await prisma.category.update({ where: { id }, data: { isArchived: true } });
    revalidatePath("/categories");
    return { archived: true };
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
  return {};
}
