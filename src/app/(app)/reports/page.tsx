import { Suspense } from "react";
import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import {
  resolveDateRange,
  getCategoryBreakdown,
  getMonthlyTrend,
  getAccountAnalysis,
  REPORT_PRESETS,
  type ReportPreset,
} from "@/lib/data/reports";
import { DateRangeControl } from "@/components/reports/date-range-control";
import { ReportSummary } from "@/components/reports/report-summary";
import { CategoryBreakdown } from "@/components/reports/category-breakdown";
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

  const [expenseBreakdown, incomeBreakdown, monthlyTrend, accountAnalysis] = await Promise.all([
    getCategoryBreakdown(userId, user.currency, range, "EXPENSE"),
    getCategoryBreakdown(userId, user.currency, range, "INCOME"),
    getMonthlyTrend(userId, user.currency),
    getAccountAnalysis(userId, range),
  ]);

  const income = incomeBreakdown.total;
  const expense = expenseBreakdown.total;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Reports</h1>

      <Suspense fallback={null}>
        <DateRangeControl preset={preset} range={range} />
      </Suspense>

      <ReportSummary income={income} expense={expense} savings={income - expense} currency={user.currency} />

      <CategoryBreakdown expense={expenseBreakdown.breakdown} income={incomeBreakdown.breakdown} currency={user.currency} />

      <MonthlyTrendChart data={monthlyTrend} currency={user.currency} />

      <AccountAnalysis accounts={accountAnalysis} />
    </div>
  );
}
