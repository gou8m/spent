import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns";
import { prisma } from "@/lib/db";
import { getAccounts } from "@/lib/data/accounts";
import { getExchangeRate } from "@/lib/exchange-rates";

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

/** Builds a `{ currency -> rate }` map for converting into `target`, skipping `target`
 * itself (implicitly rate 1) and any currency whose live rate can't be fetched right
 * now — a caller should treat a missing entry as "exclude this currency's amount",
 * same as this data always silently excluded every non-primary-currency transaction
 * before conversion existed at all, so a rate outage degrades to the old behavior
 * rather than to a wrong number. */
async function buildRateMap(currencies: string[], target: string): Promise<Map<string, number>> {
  const rates = new Map<string, number>();
  await Promise.all(
    currencies
      .filter((c) => c !== target)
      .map(async (c) => {
        const rate = await getExchangeRate(c, target);
        if (rate !== null) rates.set(c, rate);
      }),
  );
  return rates;
}

export async function getCategoryBreakdown(userId: string, currency: string, range: DateRange, type: "EXPENSE" | "INCOME") {
  const rows = await prisma.transaction.groupBy({
    by: ["categoryId", "currency"],
    where: { userId, type, status: "COMPLETED", date: { gte: range.start, lte: range.end } },
    _sum: { amount: true },
  });

  const rates = await buildRateMap(rows.map((r) => r.currency), currency);

  const byCategory = new Map<string | null, number>();
  for (const r of rows) {
    const rate = r.currency === currency ? 1 : rates.get(r.currency);
    if (rate === undefined) continue;
    const amount = Math.round((r._sum.amount ?? 0) * rate);
    byCategory.set(r.categoryId, (byCategory.get(r.categoryId) ?? 0) + amount);
  }

  const categoryIds = Array.from(byCategory.keys()).filter((id): id is string => !!id);
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const total = Array.from(byCategory.values()).reduce((sum, v) => sum + v, 0);

  const breakdown = Array.from(byCategory.entries())
    .map(([categoryId, amount]) => {
      const category = categoryId ? categories.find((c) => c.id === categoryId) : undefined;
      return {
        categoryId,
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
    where: { userId, status: "COMPLETED", type: { in: ["INCOME", "EXPENSE"] }, date: { gte: rangeStart } },
    select: { amount: true, currency: true, type: true, date: true },
  });

  const rates = await buildRateMap(transactions.map((t) => t.currency), currency);

  const buckets = new Map<string, { income: number; expense: number }>();
  for (let i = 0; i < months; i++) {
    const d = subMonths(now, months - 1 - i);
    buckets.set(format(d, "yyyy-MM"), { income: 0, expense: 0 });
  }

  for (const tx of transactions) {
    const rate = tx.currency === currency ? 1 : rates.get(tx.currency);
    if (rate === undefined) continue;
    const amount = Math.round(tx.amount * rate);
    const key = format(tx.date, "yyyy-MM");
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (tx.type === "INCOME") bucket.income += amount;
    else bucket.expense += amount;
  }

  return Array.from(buckets.entries()).map(([month, v]) => ({
    month,
    income: v.income,
    expense: v.expense,
    savings: v.income - v.expense,
  }));
}

export async function getAccountAnalysis(userId: string, currency: string, range: DateRange) {
  const accounts = await getAccounts(userId);

  const agg = await prisma.transaction.groupBy({
    by: ["accountId", "type"],
    where: { userId, status: "COMPLETED", date: { gte: range.start, lte: range.end } },
    _sum: { amount: true },
  });

  const rates = await buildRateMap(accounts.map((a) => a.currency), currency);

  return accounts.map((account) => {
    const income = agg.find((a) => a.accountId === account.id && a.type === "INCOME")?._sum.amount ?? 0;
    const expense = agg.find((a) => a.accountId === account.id && a.type === "EXPENSE")?._sum.amount ?? 0;
    const net = income - expense;

    // A quick cross-currency comparison hint alongside the account's own native figures
    // above — null (not rendered) for accounts already in the report's currency, or if a
    // live rate can't be fetched right now (never a guessed number).
    const rate = account.currency === currency ? null : rates.get(account.currency);
    const convertedNetInRange = rate != null ? Math.round(net * rate) : null;

    return { ...account, incomeInRange: income, expenseInRange: expense, netInRange: net, convertedNetInRange };
  });
}
