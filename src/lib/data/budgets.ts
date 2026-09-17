import { cache } from "react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { prisma } from "@/lib/db";
import type { BudgetPeriod } from "@/lib/constants";

export function getCurrentBudgetPeriod(
  period: BudgetPeriod,
  startDate: Date,
  endDate: Date | null,
  now: Date = new Date(),
): { start: Date; end: Date } {
  switch (period) {
    case "WEEKLY":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "MONTHLY":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "YEARLY":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "CUSTOM":
    default:
      return { start: startDate, end: endDate ?? now };
  }
}

/**
 * Wrapped in `cache()` since a dashboard/budgets page load computes
 * notifications (which also read budgets, for the "budget alert" category)
 * on top of the page's own `getBudgets` call — same request, same query,
 * otherwise fired twice.
 */
export const getBudgets = cache(async (userId: string, { includeArchived = false } = {}) => {
  const budgets = await prisma.budget.findMany({
    where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
    include: { categories: { include: { category: { include: { children: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    budgets.map(async (budget) => {
      const { start, end } = getCurrentBudgetPeriod(budget.period as BudgetPeriod, budget.startDate, budget.endDate);
      // A budget on a parent category (e.g. "Utilities") rolls up every one of its
      // subcategories' spend too — picking the parent in BudgetForm is shorthand for
      // "this + everything under it," not just transactions posted to the parent id
      // itself.
      const categoryIds = budget.categories.flatMap((c) => [c.categoryId, ...c.category.children.map((child) => child.id)]);

      const spentAgg = await prisma.transaction.aggregate({
        where: {
          userId,
          type: "EXPENSE",
          status: "COMPLETED",
          date: { gte: start, lte: end },
          ...(categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
        },
        _sum: { amount: true },
      });

      const spent = spentAgg._sum.amount ?? 0;
      return {
        ...budget,
        periodStart: start,
        periodEnd: end,
        spent,
        remaining: budget.amount - spent,
        percentUsed: budget.amount === 0 ? 0 : Math.min(100, (spent / budget.amount) * 100),
      };
    }),
  );
});

export async function getBudgetById(userId: string, id: string) {
  const budgets = await getBudgets(userId, { includeArchived: true });
  return budgets.find((b) => b.id === id) ?? null;
}
