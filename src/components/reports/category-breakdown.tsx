"use client";

import { useState } from "react";
import Link from "next/link";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatMoney } from "@/lib/money";

export interface CategoryBreakdownRow {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
}

const SLICE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const SIZE = 120;
const RADIUS = 44;
const STROKE = 19;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TOP_N = 4;

function topSlices(rows: CategoryBreakdownRow[]): CategoryBreakdownRow[] {
  const top = rows.slice(0, TOP_N);
  const rest = rows.slice(TOP_N);
  if (rest.length === 0) return top;
  const amount = rest.reduce((sum, r) => sum + r.amount, 0);
  const percent = rest.reduce((sum, r) => sum + r.percent, 0);
  return [...top, { categoryId: null, name: "Other", icon: "circle", color: "slate", amount, percent }];
}

export function CategoryBreakdown({
  expense,
  income,
  currency,
  from,
  to,
}: {
  expense: CategoryBreakdownRow[];
  income: CategoryBreakdownRow[];
  currency: string;
  from: string;
  to: string;
}) {
  const [tab, setTab] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const rows = tab === "EXPENSE" ? expense : income;
  const slices = topSlices(rows);
  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  const { segments } = slices.reduce<{ cumulative: number; segments: { dash: number; offset: number }[] }>(
    (state, slice) => {
      const dash = (slice.percent / 100) * CIRCUMFERENCE;
      const offset = -((state.cumulative / 100) * CIRCUMFERENCE);
      return { cumulative: state.cumulative + slice.percent, segments: [...state.segments, { dash, offset }] };
    },
    { cumulative: 0, segments: [] },
  );

  return (
    <div className="rounded-xl bg-surface-2 p-4.5 lg:rounded-[28px] lg:bg-surface lg:p-5.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="min-w-0 flex-1 truncate text-[1.0625rem] font-bold text-text-primary">Where it went</h2>
        <SegmentedControl
          options={[
            { value: "EXPENSE" as const, label: "Expense" },
            { value: "INCOME" as const, label: "Income" },
          ]}
          value={tab}
          onChange={setTab}
          className="w-44 shrink-0"
        />
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No {tab === "EXPENSE" ? "expenses" : "income"} in this range</p>
      ) : (
        <div className="mt-3.5 flex items-center gap-4.5 lg:mt-5 lg:gap-7">
          <div className="relative h-30 w-30 shrink-0 lg:h-47.5 lg:w-47.5">
            <svg className="h-full w-full" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${tab === "EXPENSE" ? "Spending" : "Income"} by category`}>
              <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`} fill="none" strokeWidth={STROKE}>
                {slices.map((slice, i) => (
                  <circle
                    key={slice.categoryId ?? "other"}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke={SLICE_COLORS[i % SLICE_COLORS.length]}
                    strokeDasharray={`${segments[i].dash} ${CIRCUMFERENCE - segments[i].dash}`}
                    strokeDashoffset={segments[i].offset}
                  />
                ))}
              </g>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[0.6875rem] font-semibold text-text-secondary lg:text-xs">{tab === "EXPENSE" ? "Spent" : "Earned"}</span>
              <span className="text-[0.9375rem] font-extrabold text-text-primary lg:text-[1.625rem] lg:tracking-[-0.8px]">{formatMoney(total, currency, undefined, { decimals: 0 })}</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2.5 text-sm font-semibold">
            {slices.map((slice, i) => {
              const swatch = <span className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />;
              const label = <span className="min-w-0 flex-1 truncate text-text-primary">{slice.name}</span>;
              const pct = <span className="shrink-0 text-text-secondary">{Math.round(slice.percent)}%</span>;

              if (!slice.categoryId) {
                return (
                  <div key="other" className="flex items-center gap-2">
                    {swatch}
                    {label}
                    {pct}
                  </div>
                );
              }

              return (
                <Link
                  key={slice.categoryId}
                  href={`/transactions?category=${slice.categoryId}&type=${tab}&datePreset=custom&from=${from}&to=${to}`}
                  className="flex items-center gap-2"
                >
                  {swatch}
                  {label}
                  {pct}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
