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
 *
 * `currency` is the user's primary currency — a Budget's own `amount` has no
 * currency of its own (it's just a number), so it's implicitly tracked in
 * that currency. Spend is summed from COMPLETED EXPENSE transactions in that
 * same currency only — mixing in another currency's raw minor units would
 * silently produce a meaningless total. Other-currency transactions in the
 * budget's own categories are excluded rather than converted (no live
 * historical-rate infrastructure for this yet) and flagged via
 * `hasExcludedCurrency` so the UI can say so instead of pretending the
 * number is complete.
 */
export const getBudgets = cache(async (userId: string, currency: string, { includeArchived = false, referenceDate = new Date() } = {}) => {
  const budgets = await prisma.budget.findMany({
    where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
    include: { categories: { include: { category: { include: { children: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    budgets.map(async (budget) => {
      const { start, end } = getCurrentBudgetPeriod(budget.period as BudgetPeriod, budget.startDate, budget.endDate, referenceDate);
      // A budget on a parent category (e.g. "Utilities") rolls up every one of its
      // subcategories' spend too — picking the parent in BudgetForm is shorthand for
      // "this + everything under it," not just transactions posted to the parent id
      // itself.
      const categoryIds = budget.categories.flatMap((c) => [c.categoryId, ...c.category.children.map((child) => child.id)]);
      const categoryFilter = categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {};

      const [spentAgg, otherCurrencyCount] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: "EXPENSE", status: "COMPLETED", currency, date: { gte: start, lte: end }, ...categoryFilter },
          _sum: { amount: true },
        }),
        prisma.transaction.count({
          where: { userId, type: "EXPENSE", status: "COMPLETED", currency: { not: currency }, date: { gte: start, lte: end }, ...categoryFilter },
        }),
      ]);

      const spent = spentAgg._sum.amount ?? 0;
      const rawPercentUsed = budget.amount === 0 ? 0 : (spent / budget.amount) * 100;
      return {
        ...budget,
        periodStart: start,
        periodEnd: end,
        spent,
        remaining: budget.amount - spent,
        percentUsed: Math.min(100, rawPercentUsed),
        /** Unrounded, uncapped — for a detail view's "111% over" style display,
         * where percentUsed's 100% cap (meant for a progress bar's width) would
         * understate how far over the budget actually is. */
        rawPercentUsed,
        hasExcludedCurrency: otherCurrencyCount > 0,
      };
    }),
  );
});

export async function getBudgetById(userId: string, currency: string, id: string) {
  const budgets = await getBudgets(userId, currency, { includeArchived: true });
  return budgets.find((b) => b.id === id) ?? null;
}
