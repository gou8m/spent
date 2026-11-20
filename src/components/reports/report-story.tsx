import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CategoryBreakdownRow } from "@/components/reports/category-breakdown";

const BAR_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];
const RING_R = 40;
const RING_C = 2 * Math.PI * RING_R;

/** The sentence after "You saved": this week, this month, this year, or in the chosen range. */
export const PERIOD_PHRASE: Record<string, string> = {
  thisWeek: "this week",
  thisMonth: "this month",
  thisYear: "this year",
  custom: "in this range",
};

/**
 * The top of Reports: the answer first. How much was kept (or overspent) and what share of the income that is,
 * then income and spending as two equal tiles.
 */
export function ReportStory({
  income,
  expense,
  currency,
  phrase,
}: {
  income: number;
  expense: number;
  currency: string;
  phrase: string;
}) {
  const saved = income - expense;
  const over = saved < 0;
  const percent = income > 0 ? Math.max(0, Math.min(100, Math.round((saved / income) * 100))) : 0;
  const whole = (minor: number) => formatMoney(minor, currency, undefined, { decimals: 0 });

  return (
    <div className="space-y-2.5">
      <div
        className={cn("flex items-center gap-4 rounded-[26px] px-5 py-5", over ? "bg-error-subtle text-error" : "text-hero-text")}
        style={over ? undefined : { background: "var(--hero-gradient)" }}
      >
        <div className="relative h-24 w-24 shrink-0" role="img" aria-label={over ? "Spent more than earned" : `${percent} percent of income saved`}>
          <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
            <circle cx="48" cy="48" r={RING_R} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="12" />
            {percent > 0 && (
              <circle
                cx="48"
                cy="48"
                r={RING_R}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(percent / 100) * RING_C} ${RING_C}`}
              />
            )}
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[1.375rem] font-extrabold tracking-tight">{over ? "0%" : `${percent}%`}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[0.8125rem] font-bold", over ? "text-error" : "text-hero-text-secondary")}>{over ? `You spent more than you earned ${phrase}` : `You saved ${phrase}`}</p>
          <p className="mt-0.5 truncate text-[1.875rem] font-extrabold leading-tight tracking-[-0.03em]">{over ? whole(Math.abs(saved)) : whole(saved)}</p>
          <p className={cn("mt-1 text-xs font-semibold", over ? "text-error" : "text-hero-text-secondary")}>
            {income > 0 ? (over ? `short, from ${whole(income)} earned` : `of ${whole(income)} earned`) : "No income recorded"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="min-w-0 rounded-[20px] bg-surface-2 px-3 py-3.5 text-center">
          <p className="text-xs font-bold text-text-secondary">Income</p>
          <p className="mt-0.5 truncate text-[1.25rem] font-extrabold tracking-tight text-text-primary">{whole(income)}</p>
        </div>
        <div className="min-w-0 rounded-[20px] bg-surface-2 px-3 py-3.5 text-center">
          <p className="text-xs font-bold text-text-secondary">Spent</p>
          <p className="mt-0.5 truncate text-[1.25rem] font-extrabold tracking-tight text-text-primary">{whole(expense)}</p>
        </div>
      </div>
    </div>
  );
}

/** One line of insight, with the same icon tile as elsewhere. */
export function ReportInsight({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-accent-subtle px-4 py-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-accent text-text-on-accent">
        <TrendingUp size={18} strokeWidth={2} />
      </span>
      <p className="text-sm font-semibold leading-snug text-accent-hover">{text}</p>
    </div>
  );
}

/** The biggest spending categories, each with a bar sized against the largest. */
export function TopCategories({
  rows,
  currency,
  from,
  to,
}: {
  rows: CategoryBreakdownRow[];
  currency: string;
  from: string;
  to: string;
}) {
  const top = rows.slice(0, 4);
  if (top.length === 0) return null;
  const max = Math.max(...top.map((r) => r.amount), 1);
  const seeAll = `/transactions?type=EXPENSE&datePreset=custom&from=${from}&to=${to}`;

  return (
    <div className="rounded-[24px] bg-surface-2 p-4.5">
      <div className="flex items-center justify-between">
        <h2 className="text-[1.0625rem] font-bold text-text-primary">Top categories</h2>
        <Link href={seeAll} className="text-xs font-bold text-accent-text hover:underline">
          See all
        </Link>
      </div>
      <div className="mt-3.5 space-y-3.5">
        {top.map((row, i) => {
          const inner = (
            <>
              <span className="flex items-center justify-between gap-3 text-[0.8125rem] font-bold text-text-primary">
                <span className="min-w-0 truncate">{row.name}</span>
                <span className="shrink-0">{formatMoney(row.amount, currency, undefined, { decimals: 0 })}</span>
              </span>
              <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-bg">
                <span className="block h-full rounded-full" style={{ width: `${Math.max(3, (row.amount / max) * 100)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
              </span>
            </>
          );
          return row.categoryId ? (
            <Link key={row.categoryId} href={`/transactions?category=${row.categoryId}&type=EXPENSE&datePreset=custom&from=${from}&to=${to}`} className="block">
              {inner}
            </Link>
          ) : (
            <div key={`row-${i}`}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
