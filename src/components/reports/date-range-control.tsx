"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/input";
import type { ReportPreset, DateRange } from "@/lib/data/reports";

const PRESET_LABELS: Record<ReportPreset, string> = {
  thisMonth: "This month",
  lastMonth: "Last month",
  last3Months: "Last 3 months",
  thisYear: "This year",
  allTime: "All time",
  custom: "Custom",
};

const PRESET_ORDER: ReportPreset[] = ["thisMonth", "lastMonth", "last3Months", "thisYear", "allTime", "custom"];

export function DateRangeControl({ preset, range }: { preset: ReportPreset; range: DateRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setPreset(next: ReportPreset) {
    const params = new URLSearchParams(searchParams);
    params.set("preset", next);
    if (next !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function setCustom(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams);
    params.set("preset", "custom");
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {PRESET_ORDER.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              preset === p ? "bg-accent text-text-on-accent" : "bg-surface-2 text-text-secondary hover:bg-surface-3"
            }`}
          >
            {PRESET_LABELS[p]}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <div>
            <Label htmlFor="report-from">From</Label>
            <DatePicker value={format(range.start, "yyyy-MM-dd")} onChange={(v) => setCustom("from", v)} />
          </div>
          <div>
            <Label htmlFor="report-to">To</Label>
            <DatePicker value={format(range.end, "yyyy-MM-dd")} onChange={(v) => setCustom("to", v)} />
          </div>
        </div>
      )}
    </div>
  );
}
