"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { budgetSchema, type BudgetInput } from "@/lib/validations/budget";
import { toMinorUnits } from "@/lib/money";

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
