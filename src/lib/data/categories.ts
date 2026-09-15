import { cache } from "react";
import { prisma } from "@/lib/db";

/** Cached per-request (same convention as `getCurrentUser`) — the app shell already
 * fetches both types for the global "Add transaction" sheet, and several pages
 * (budgets, recurring) fetch the same type again for their own forms. */
export const getCategories = cache(async (userId: string, type?: "INCOME" | "EXPENSE", { includeArchived = false } = {}) => {
  return prisma.category.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
      ...(includeArchived ? {} : { isArchived: false }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
});

/** How many times each category has been used, for the transaction form's "Suggested"
 * section — every transaction ever recorded, not scoped to a date range, so a category
 * used heavily in the past keeps surfacing even during a currently-quiet month. */
export const getCategoryUsageCounts = cache(async (userId: string, type: "INCOME" | "EXPENSE"): Promise<Record<string, number>> => {
  const rows = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type, categoryId: { not: null } },
    _count: true,
  });
  return Object.fromEntries(rows.filter((r) => r.categoryId).map((r) => [r.categoryId as string, r._count]));
});
