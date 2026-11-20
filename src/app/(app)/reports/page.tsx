import { Suspense } from "react";
import { format, parse } from "date-fns";
import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { resolveDateRange, getCategoryBreakdown, getMonthlyTrend, REPORT_PRESETS, type ReportPreset } from "@/lib/data/reports";
import { formatMoney } from "@/lib/money";
import { BackHeader } from "@/components/layout/back-header";
import { DateRangeControl } from "@/components/reports/date-range-control";
import { PERIOD_PHRASE, ReportInsight, ReportStory, TopCategories } from "@/components/reports/report-story";
import { CategoryBreakdown } from "@/components/reports/category-breakdown";
import { MonthlySpendingChart } from "@/components/reports/monthly-spending-chart";

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

  const [expenseBreakdown, incomeBreakdown, monthlyTrend] = await Promise.all([
    getCategoryBreakdown(userId, user.currency, range, "EXPENSE"),
    getCategoryBreakdown(userId, user.currency, range, "INCOME"),
    getMonthlyTrend(userId, user.currency),
  ]);

  const income = incomeBreakdown.total;
  const expense = expenseBreakdown.total;
  const fromParam = format(range.start, "yyyy-MM-dd");
  const toParam = format(range.end, "yyyy-MM-dd");

  // One line of insight. This month's compares with last month; any other range names its biggest spend.
  const thisM = monthlyTrend[monthlyTrend.length - 1];
  const prevM = monthlyTrend[monthlyTrend.length - 2];
  const top = expenseBreakdown.breakdown[0];
  const insight =
    preset === "thisMonth" && thisM && prevM && prevM.expense > 0 && top
      ? (() => {
          const diff = Math.round(((thisM.expense - prevM.expense) / prevM.expense) * 100);
          return `Spending is ${Math.abs(diff)}% ${diff <= 0 ? "less" : "more"} than ${format(parse(prevM.month, "yyyy-MM", new Date()), "MMMM")}, mostly on ${top.name}.`;
        })()
      : top
        ? `${top.name} was your biggest spend: ${Math.round(top.percent)}% (${formatMoney(top.amount, user.currency, undefined, { decimals: 0 })}).`
        : null;

  return (
    <div className="space-y-5">
      <BackHeader href="/dashboard" title="Reports" desktopRoot />

      <Suspense fallback={null}>
        <DateRangeControl preset={preset} range={range} />
      </Suspense>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-2.5">
          <ReportStory income={income} expense={expense} currency={user.currency} phrase={PERIOD_PHRASE[preset]} />
          {insight && <ReportInsight text={insight} />}
        </div>
        <TopCategories rows={expenseBreakdown.breakdown} currency={user.currency} from={fromParam} to={toParam} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <CategoryBreakdown expense={expenseBreakdown.breakdown} income={incomeBreakdown.breakdown} currency={user.currency} from={fromParam} to={toParam} />

        <MonthlySpendingChart data={monthlyTrend.map((m) => ({ month: m.month, expense: m.expense }))} />
      </div>
    </div>
  );
}
