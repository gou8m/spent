import { Suspense } from "react";
import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import {
  resolveDateRange,
  getCategoryBreakdown,
  getMonthlyTrend,
  getSpendingTrend,
  getAccountAnalysis,
  REPORT_PRESETS,
  type ReportPreset,
} from "@/lib/data/reports";
import { DateRangeControl } from "@/components/reports/date-range-control";
import { ReportSummary } from "@/components/reports/report-summary";
import { CategoryBreakdown } from "@/components/reports/category-breakdown";
import { SpendingTrendChart } from "@/components/reports/spending-trend-chart";
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

  const [expenseBreakdown, incomeBreakdown, monthlyTrend, spendingTrend, accountAnalysis] = await Promise.all([
    getCategoryBreakdown(userId, user.currency, range, "EXPENSE"),
    getCategoryBreakdown(userId, user.currency, range, "INCOME"),
    getMonthlyTrend(userId, user.currency),
    getSpendingTrend(userId, user.currency, range),
    getAccountAnalysis(userId, user.currency, range),
  ]);

  const income = incomeBreakdown.total;
  const expense = expenseBreakdown.total;
  const hasOtherCurrency = accountAnalysis.some((a) => a.currency !== user.currency);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Reports</h1>
        {hasOtherCurrency && (
          <p className="mt-0.5 text-xs text-text-muted">
            Other-currency accounts are converted to {user.currency} using live exchange rates.
          </p>
        )}
      </div>

      <Suspense fallback={null}>
        <DateRangeControl preset={preset} range={range} />
      </Suspense>

      <ReportSummary income={income} expense={expense} savings={income - expense} currency={user.currency} />

      <CategoryBreakdown expense={expenseBreakdown.breakdown} income={incomeBreakdown.breakdown} currency={user.currency} />

      <SpendingTrendChart data={spendingTrend} currency={user.currency} />

      <MonthlyTrendChart data={monthlyTrend} currency={user.currency} />

      <AccountAnalysis accounts={accountAnalysis} currency={user.currency} />
    </div>
  );
}
