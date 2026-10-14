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

const RADIUS = 52;
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
    <div className="rounded-xl bg-surface-2 p-4.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[1.0625rem] font-bold text-text-primary">Where it went</h2>
        <SegmentedControl
          options={[
            { value: "EXPENSE" as const, label: "Expenses" },
            { value: "INCOME" as const, label: "Income" },
          ]}
          value={tab}
          onChange={setTab}
          className="w-40"
        />
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No {tab === "EXPENSE" ? "expenses" : "income"} in this range</p>
      ) : (
        <div className="mt-3.5 flex items-center gap-4.5">
          <div className="relative h-35 w-35 shrink-0">
            <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`${tab === "EXPENSE" ? "Spending" : "Income"} by category`}>
              <g transform="rotate(-90 70 70)" fill="none" strokeWidth="22">
                {slices.map((slice, i) => (
                  <circle
                    key={slice.categoryId ?? "other"}
                    cx="70"
                    cy="70"
                    r={RADIUS}
                    stroke={SLICE_COLORS[i % SLICE_COLORS.length]}
                    strokeDasharray={`${segments[i].dash} ${CIRCUMFERENCE - segments[i].dash}`}
                    strokeDashoffset={segments[i].offset}
                  />
                ))}
              </g>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-text-secondary">Total</span>
              <span className="text-xl font-extrabold text-text-primary">{formatMoney(total, currency)}</span>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 text-sm font-semibold">
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
