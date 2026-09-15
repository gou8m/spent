import { startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/lib/db";
import { getAccountBalances } from "@/lib/balances";
import { getAccounts } from "@/lib/data/accounts";
import { getRecentTransactions, getUpcomingTransactions } from "@/lib/data/transactions";
import { getBudgets } from "@/lib/data/budgets";
import { getMonthlyTrend } from "@/lib/data/reports";
import { generateDueOccurrences } from "@/lib/recurring-generator";
import { getExchangeRate } from "@/lib/exchange-rates";

const TREND_MONTHS = 3;

export async function getDashboardData(userId: string, currency: string, now: Date = new Date()) {
  await generateDueOccurrences(userId, now);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [accounts, balances, monthAgg, trend, recentTransactions, upcoming, budgets] = await Promise.all([
    getAccounts(userId),
    getAccountBalances(userId),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, status: "COMPLETED", currency, date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    getMonthlyTrend(userId, currency, TREND_MONTHS, now),
    getRecentTransactions(userId, 6),
    getUpcomingTransactions(userId, 5),
    getBudgets(userId),
  ]);

  // Credit cards are a liability, not held money — including one would make the
  // headline "Total balance" read as richer than the user actually is.
  const totalBalance = accounts
    .filter((a) => a.currency === currency && a.type !== "CREDIT_CARD")
    .reduce((sum, a) => sum + (balances[a.id] ?? a.startingBalance), 0);

  const income = monthAgg.find((g) => g.type === "INCOME")?._sum.amount ?? 0;
  const expense = monthAgg.find((g) => g.type === "EXPENSE")?._sum.amount ?? 0;
  const savings = income - expense;

  const otherCurrencyAccounts = accounts.filter((a) => a.currency !== currency);

  // Grouped by currency (not shown per-account) — e.g. two INR accounts become one "other balance" line.
  // Credit cards excluded here too, same liability-vs-asset reasoning as totalBalance above.
  const otherBalancesByCurrency = new Map<string, number>();
  for (const a of otherCurrencyAccounts) {
    if (a.type === "CREDIT_CARD") continue;
    otherBalancesByCurrency.set(a.currency, (otherBalancesByCurrency.get(a.currency) ?? 0) + a.balance);
  }
  const otherBalances = Array.from(otherBalancesByCurrency.entries()).map(([currency, balance]) => ({ currency, balance }));

  // Net worth converted into the primary currency, on top of the existing per-currency
  // "Other balances" breakdown — reuses the same live-rate lookup the transfer form
  // already relies on. Null (rather than a silently wrong number) if any rate can't be
  // fetched right now; the UI falls back to just the primary-currency total in that case.
  let netWorth: number | null = totalBalance;
  if (otherBalances.length > 0) {
    const converted = await Promise.all(
      otherBalances.map(async (b) => {
        const rate = await getExchangeRate(b.currency, currency);
        return rate === null ? null : b.balance * rate;
      }),
    );
    netWorth = converted.some((c) => c === null) ? null : totalBalance + converted.reduce<number>((sum, c) => sum + (c ?? 0), 0);
  }

  return {
    totalBalance,
    netWorth,
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
