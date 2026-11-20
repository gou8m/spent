"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { FileText, ChevronRight, Download } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Chip } from "@/components/ui/chip";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/input";
import { resolveStatementRange, type StatementRange } from "@/lib/statement-range";

const OPTIONS: { value: StatementRange; label: string }[] = [
  { value: "last-month", label: "Last month" },
  { value: "3-months", label: "Last 3 months" },
  { value: "6-months", label: "Last 6 months" },
  { value: "custom", label: "Date range" },
];

/** The "Download statement" row in Settings > Data, with the range picker it opens. */
export function StatementRow() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<StatementRange>("last-month");
  const [from, setFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const resolved = resolveStatementRange(range, from, to);
  const valid = !("error" in resolved);
  const summary = valid ? `${format(resolved.start, "d MMM yyyy")} – ${format(resolved.end, "d MMM yyyy")}` : resolved.error;

  const params = new URLSearchParams({ range });
  if (range === "custom") {
    params.set("from", from);
    params.set("to", to);
  }
  const href = `/api/export/statement?${params.toString()}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-13 w-full items-center gap-3.5 px-4 text-left hover:bg-surface-3"
      >
        <FileText size={22} strokeWidth={2} className="shrink-0 text-accent-text" />
        <span className="flex-1 text-base font-semibold text-text-primary">Download statement</span>
        <ChevronRight size={19} strokeWidth={2} className="shrink-0 text-text-secondary" />
      </button>

      <Sheet open={open} onOpenChange={setOpen} title="Download statement">
        <div className="space-y-4 pb-2">
          <p className="text-sm leading-snug text-text-secondary">
            A PDF of your transactions with totals, where the money went and a per-account summary.
          </p>

          <div>
            <p className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Period</p>
            <div className="flex flex-wrap gap-2">
              {OPTIONS.map((o) => (
                <Chip key={o.value} selected={range === o.value} onClick={() => setRange(o.value)}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </div>

          {range === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From</Label>
                <DatePicker value={from} onChange={setFrom} />
              </div>
              <div>
                <Label>To</Label>
                <DatePicker value={to} onChange={setTo} />
              </div>
            </div>
          )}

          <p className={`rounded-[18px] px-4 py-3 text-sm font-semibold ${valid ? "bg-surface-2 text-text-primary" : "bg-error-subtle text-error"}`}>{summary}</p>

          <a
            href={valid ? href : undefined}
            download
            aria-disabled={!valid}
            onClick={(e) => {
              if (!valid) {
                e.preventDefault();
                return;
              }
              toast.success("Preparing your statement…");
              setOpen(false);
            }}
            className={`flex h-14 w-full items-center justify-center gap-2 rounded-[20px] text-[1.0625rem] font-bold text-text-on-accent shadow-[0_8px_20px_rgba(27,107,51,0.28)] transition-colors ${
              valid ? "bg-accent hover:bg-accent-hover" : "pointer-events-none bg-accent opacity-50"
            }`}
          >
            <Download size={22} strokeWidth={2.25} />
            Download PDF
          </a>
        </div>
      </Sheet>
    </>
  );
}
