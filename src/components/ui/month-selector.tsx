"use client";

import { useState } from "react";
import { format, startOfMonth } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => format(new Date(2000, i, 1), "MMM"));

/** "November ▾": a real dropdown. It opens a grid of the twelve months with the year at the top
 * (its arrows change the year only), so one tap on any month jumps straight to it. */
export function MonthSelector({ month, onChange }: { month: Date; onChange: (month: Date) => void }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(month.getFullYear());

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setYear(month.getFullYear());
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Month: ${format(month, "MMMM yyyy")}`}
          className="flex h-11 items-center gap-1.5 rounded-sm bg-surface-2 px-3.5 text-sm font-bold text-text-primary"
        >
          {format(month, "MMMM")}
          <ChevronDown size={16} strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous year"
            onClick={() => setYear((y) => y - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-2"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-extrabold text-text-primary">{year}</span>
          <button
            type="button"
            aria-label="Next year"
            onClick={() => setYear((y) => y + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-2"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTH_LABELS.map((label, i) => {
            const selected = year === month.getFullYear() && i === month.getMonth();
            return (
              <button
                key={label}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onChange(startOfMonth(new Date(year, i, 1)));
                  setOpen(false);
                }}
                className={cn(
                  "h-10 rounded-full text-sm transition-colors",
                  selected ? "bg-accent font-bold text-text-on-accent" : "font-semibold text-text-primary hover:bg-surface-2",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
