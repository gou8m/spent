import { startOfMonth, endOfMonth, subDays, eachDayOfInterval, format, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { getAccountBalances } from "@/lib/balances";
import { getAccounts } from "@/lib/data/accounts";
import { getRecentTransactions, getUpcomingTransactions } from "@/lib/data/transactions";
import { getBudgets } from "@/lib/data/budgets";
import { generateDueOccurrences } from "@/lib/recurring-generator";

export async function getDashboardData(userId: string, currency: string, now: Date = new Date()) {
  await generateDueOccurrences(userId, now);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const trendStart = startOfDay(subDays(now, 29));

  const [accounts, balances, monthAgg, trendTx, recentTransactions, upcoming, budgets] = await Promise.all([
    getAccounts(userId),
    getAccountBalances(userId),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, status: "COMPLETED", currency, date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, status: "COMPLETED", currency, type: { in: ["INCOME", "EXPENSE"] }, date: { gte: trendStart } },
      select: { amount: true, type: true, date: true },
    }),
    getRecentTransactions(userId, 6),
    getUpcomingTransactions(userId, 5),
    getBudgets(userId),
  ]);

  const totalBalance = accounts
    .filter((a) => a.currency === currency)
    .reduce((sum, a) => sum + (balances[a.id] ?? a.startingBalance), 0);

  const income = monthAgg.find((g) => g.type === "INCOME")?._sum.amount ?? 0;
  const expense = monthAgg.find((g) => g.type === "EXPENSE")?._sum.amount ?? 0;
  const savings = income - expense;

  const dayBuckets = new Map<string, { income: number; expense: number }>();
  for (const day of eachDayOfInterval({ start: trendStart, end: now })) {
    dayBuckets.set(format(day, "yyyy-MM-dd"), { income: 0, expense: 0 });
  }
  for (const tx of trendTx) {
    const key = format(tx.date, "yyyy-MM-dd");
    const bucket = dayBuckets.get(key);
    if (!bucket) continue;
    if (tx.type === "INCOME") bucket.income += tx.amount;
    else bucket.expense += tx.amount;
  }
  const trend = Array.from(dayBuckets.entries()).map(([date, values]) => ({ date, ...values }));

  const otherCurrencyAccounts = accounts.filter((a) => a.currency !== currency);

  // Grouped by currency (not shown per-account) — e.g. two INR accounts become one "other balance" line.
  const otherBalancesByCurrency = new Map<string, number>();
  for (const a of otherCurrencyAccounts) {
    otherBalancesByCurrency.set(a.currency, (otherBalancesByCurrency.get(a.currency) ?? 0) + a.balance);
  }
  const otherBalances = Array.from(otherBalancesByCurrency.entries()).map(([currency, balance]) => ({ currency, balance }));

  return {
    totalBalance,
    income,
    expense,
    savings,
    trend,
    accounts,
    otherCurrencyAccounts,
    otherBalances,
    recentTransactions,
    upcoming,
    budgets: budgets.slice(0, 4),
  };
}
