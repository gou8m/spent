"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/input";
import type { ReportPreset, DateRange } from "@/lib/data/reports";

const PRESET_LABELS: Record<ReportPreset, string> = {
  thisWeek: "Week",
  thisMonth: "Month",
  thisYear: "Year",
  custom: "Custom",
};

const PRESET_ORDER: ReportPreset[] = ["thisWeek", "thisMonth", "thisYear", "custom"];

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
    <div className="space-y-3 md:max-w-95">
      <SegmentedControl options={PRESET_ORDER.map((p) => ({ value: p, label: PRESET_LABELS[p] }))} value={preset} onChange={setPreset} />

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
