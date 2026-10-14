import { Suspense } from "react";
import { format, parse } from "date-fns";
import { TrendingUp } from "lucide-react";
import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import {
  resolveDateRange,
  getCategoryBreakdown,
  getMonthlyTrend,
  getSpendingTrend,
  getNetWorthHistory,
  getAccountBalanceSeries,
  getAccountAnalysis,
  REPORT_PRESETS,
  type ReportPreset,
} from "@/lib/data/reports";
import { BackHeader } from "@/components/layout/back-header";
import { DateRangeControl } from "@/components/reports/date-range-control";
import { ReportSummary } from "@/components/reports/report-summary";
import { CategoryBreakdown } from "@/components/reports/category-breakdown";
import { MonthlySpendingChart } from "@/components/reports/monthly-spending-chart";
import { SpendingTrendChart } from "@/components/reports/spending-trend-chart";
import { NetWorthTrendChart } from "@/components/reports/net-worth-trend-chart";
import { AccountBalancesChart } from "@/components/reports/account-balances-chart";
import { MonthlyTrendChart } from "@/components/reports/monthly-trend-chart";
import { AccountAnalysis } from "@/components/reports/account-analysis";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const userId = await requireUserId();
  const user = await getCurrentUser(userId);

  const { preset: presetParam, from, to } = await searchParams;
  const preset: ReportPreset = REPORT_PRESETS.includes(presetParam as ReportPreset) ? (presetParam as ReportPreset) : "thisMonth";
  const range = resolveDateRange(preset, new Date(), { from, to });

  const [expenseBreakdown, incomeBreakdown, monthlyTrend, spendingTrend, netWorthHistory, accountBalanceSeries, accountAnalysis] =
    await Promise.all([
      getCategoryBreakdown(userId, user.currency, range, "EXPENSE"),
      getCategoryBreakdown(userId, user.currency, range, "INCOME"),
      getMonthlyTrend(userId, user.currency),
      getSpendingTrend(userId, user.currency, range),
      getNetWorthHistory(userId, user.currency),
      getAccountBalanceSeries(userId, user.currency),
      getAccountAnalysis(userId, user.currency, range),
    ]);

  const income = incomeBreakdown.total;
  const expense = expenseBreakdown.total;
  const hasOtherCurrency = accountAnalysis.some((a) => a.currency !== user.currency);

  const thisM = monthlyTrend[monthlyTrend.length - 1];
  const prevM = monthlyTrend[monthlyTrend.length - 2];
  const topCategory = expenseBreakdown.breakdown[0]?.name;
  const insight =
    thisM && prevM && prevM.expense > 0 && topCategory
      ? (() => {
          const diff = Math.round(((thisM.expense - prevM.expense) / prevM.expense) * 100);
          const direction = diff <= 0 ? "less" : "more";
          return `You're spending ${Math.abs(diff)}% ${direction} than ${format(parse(prevM.month, "yyyy-MM", new Date()), "MMMM")} — mostly on ${topCategory}.`;
        })()
      : null;

  return (
    <div className="space-y-5">
      <BackHeader href="/dashboard" title="Reports" />

      {hasOtherCurrency && (
        <p className="text-xs text-text-muted">Other-currency accounts are converted to {user.currency} using live exchange rates.</p>
      )}

      <Suspense fallback={null}>
        <DateRangeControl preset={preset} range={range} />
      </Suspense>

      <ReportSummary income={income} expense={expense} savings={income - expense} currency={user.currency} />

      <CategoryBreakdown
        expense={expenseBreakdown.breakdown}
        income={incomeBreakdown.breakdown}
        currency={user.currency}
        from={format(range.start, "yyyy-MM-dd")}
        to={format(range.end, "yyyy-MM-dd")}
      />

      <MonthlySpendingChart data={monthlyTrend.map((m) => ({ month: m.month, expense: m.expense }))} />

      {insight && (
        <div className="flex items-center gap-3 rounded-lg bg-accent-subtle px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-accent text-text-on-accent">
            <TrendingUp size={18} strokeWidth={2} />
          </span>
          <p className="text-sm font-semibold leading-snug text-accent-hover">{insight}</p>
        </div>
      )}

      <div className="space-y-5 pt-2">
        <h2 className="text-lg font-bold text-text-primary">More analysis</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <SpendingTrendChart data={spendingTrend} currency={user.currency} />
          <NetWorthTrendChart data={netWorthHistory} currency={user.currency} />
        </div>

        <AccountBalancesChart data={accountBalanceSeries.data} accounts={accountBalanceSeries.accounts} currency={user.currency} />

        <MonthlyTrendChart data={monthlyTrend} currency={user.currency} />

        <AccountAnalysis accounts={accountAnalysis} currency={user.currency} />
      </div>
    </div>
  );
}
