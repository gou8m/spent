"use client";

import { useRouter } from "next/navigation";
import { format, parse, startOfMonth, endOfMonth } from "date-fns";

export function MonthlySpendingChart({ data }: { data: { month: string; expense: number }[] }) {
  const router = useRouter();
  const max = Math.max(...data.map((d) => d.expense), 1);
  const currentKey = data[data.length - 1]?.month;

  function selectMonth(monthKey: string) {
    const d = parse(monthKey, "yyyy-MM", new Date());
    const params = new URLSearchParams();
    params.set("preset", "custom");
    params.set("from", format(startOfMonth(d), "yyyy-MM-dd"));
    params.set("to", format(endOfMonth(d), "yyyy-MM-dd"));
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="rounded-xl bg-surface-2 p-4.5 pb-3.5 lg:rounded-[28px] lg:bg-surface lg:p-5.5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[1.0625rem] font-bold text-text-primary">Monthly spending</h2>
        <span className="text-xs font-semibold text-text-secondary">Last 6 months</span>
      </div>
      <div className="mt-3.5 flex h-33 items-end gap-3">
        {data.map((d) => {
          const isCurrent = d.month === currentKey;
          const height = Math.max(8, Math.round((d.expense / max) * 108));
          return (
            <button key={d.month} type="button" onClick={() => selectMonth(d.month)} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={isCurrent ? "w-full rounded-t-[10px] rounded-b-[4px] bg-accent" : "w-full rounded-t-[10px] rounded-b-[4px] bg-chart-5"}
                style={{ height }}
              />
              <span className={isCurrent ? "text-xs font-bold text-accent-text" : "text-xs font-semibold text-text-secondary"}>
                {format(parse(d.month, "yyyy-MM", new Date()), "MMM")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
