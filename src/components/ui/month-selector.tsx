"use client";

import { format, addMonths, subMonths } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

/** The reference's single "October ▾" pill — a dropdown-style trigger that opens a
 * compact prev/month/next stepper, not two separate arrow buttons on the page itself. */
export function MonthSelector({ month, onChange }: { month: Date; onChange: (month: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-11 items-center gap-1.5 rounded-sm bg-surface-2 px-3.5 text-sm font-bold text-text-primary"
        >
          {format(month, "MMMM")}
          <ChevronDown size={16} strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="flex items-center gap-1 p-1.5" align="end">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => onChange(subMonths(month, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-2"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-28 text-center text-sm font-bold text-text-primary">{format(month, "MMMM yyyy")}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => onChange(addMonths(month, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-2"
        >
          <ChevronRight size={16} />
        </button>
      </PopoverContent>
    </Popover>
  );
}
