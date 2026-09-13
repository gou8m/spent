import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns";
import { prisma } from "@/lib/db";
import { getAccounts } from "@/lib/data/accounts";

export interface DateRange {
  start: Date;
  end: Date;
}

export const REPORT_PRESETS = ["thisMonth", "lastMonth", "last3Months", "thisYear", "allTime", "custom"] as const;
export type ReportPreset = (typeof REPORT_PRESETS)[number];

/** No transaction predates this — a simple stand-in for "no lower bound" that avoids a conditional where clause. */
const EPOCH = new Date(2000, 0, 1);

export function resolveDateRange(preset: ReportPreset, now: Date = new Date(), custom?: { from?: string; to?: string }): DateRange {
  switch (preset) {
    case "lastMonth": {
      const d = subMonths(now, 1);
      return { start: startOfMonth(d), end: endOfMonth(d) };
    }
    case "last3Months":
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
    case "thisYear":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "allTime":
      return { start: EPOCH, end: now };
    case "custom":
      return {
        start: custom?.from ? new Date(custom.from) : startOfMonth(now),
        end: custom?.to ? new Date(custom.to) : now,
      };
    case "thisMonth":
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

export async function getCategoryBreakdown(userId: string, currency: string, range: DateRange, type: "EXPENSE" | "INCOME") {
  const rows = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type, status: "COMPLETED", currency, date: { gte: range.start, lte: range.end } },
    _sum: { amount: true },
  });

  const categoryIds = rows.map((r) => r.categoryId).filter((id): id is string => !!id);
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const total = rows.reduce((sum, r) => sum + (r._sum.amount ?? 0), 0);

  const breakdown = rows
    .map((r) => {
      const category = categories.find((c) => c.id === r.categoryId);
      const amount = r._sum.amount ?? 0;
      return {
        categoryId: r.categoryId,
        name: category?.name ?? "Uncategorized",
        icon: category?.icon ?? "circle",
        color: category?.color ?? "slate",
        amount,
        percent: total === 0 ? 0 : (amount / total) * 100,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return { breakdown, total };
}

/** Fixed monthly buckets independent of the report's selected range — a
 * month-over-month comparison and a custom day-range don't mix cleanly, so
 * this always looks back a fixed number of calendar months from today. */
export async function getMonthlyTrend(userId: string, currency: string, months = 6, now: Date = new Date()) {
  const rangeStart = startOfMonth(subMonths(now, months - 1));

  const transactions = await prisma.transaction.findMany({
    where: { userId, currency, status: "COMPLETED", type: { in: ["INCOME", "EXPENSE"] }, date: { gte: rangeStart } },
    select: { amount: true, type: true, date: true },
  });

  const buckets = new Map<string, { income: number; expense: number }>();
  for (let i = 0; i < months; i++) {
    const d = subMonths(now, months - 1 - i);
    buckets.set(format(d, "yyyy-MM"), { income: 0, expense: 0 });
  }

  for (const tx of transactions) {
    const key = format(tx.date, "yyyy-MM");
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (tx.type === "INCOME") bucket.income += tx.amount;
    else bucket.expense += tx.amount;
  }

  return Array.from(buckets.entries()).map(([month, v]) => ({
    month,
    income: v.income,
    expense: v.expense,
    savings: v.income - v.expense,
  }));
}

export async function getAccountAnalysis(userId: string, range: DateRange) {
  const accounts = await getAccounts(userId);

  const agg = await prisma.transaction.groupBy({
    by: ["accountId", "type"],
    where: { userId, status: "COMPLETED", date: { gte: range.start, lte: range.end } },
    _sum: { amount: true },
  });

  return accounts.map((account) => {
    const income = agg.find((a) => a.accountId === account.id && a.type === "INCOME")?._sum.amount ?? 0;
    const expense = agg.find((a) => a.accountId === account.id && a.type === "EXPENSE")?._sum.amount ?? 0;
    return { ...account, incomeInRange: income, expenseInRange: expense, netInRange: income - expense };
  });
}
