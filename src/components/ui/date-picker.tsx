"use client";

import { useState } from "react";
import {
  format,
  parse,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Accepts/emits plain "yyyy-MM-dd" strings, matching the native date input it replaces. */
export function DatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : new Date();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(startOfMonth(selected));

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  function pick(day: Date) {
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setMonth(startOfMonth(selected));
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full items-center gap-2.5 rounded-full bg-surface-2 px-4.5 text-[0.9375rem] text-text-primary outline-none focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent-subtle"
        >
          <Calendar size={16} className="shrink-0 text-text-muted" />
          {format(selected, "MMM d, yyyy")}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonth(subMonths(month, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-sm font-semibold text-text-primary">{format(month, "MMMM yyyy")}</p>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonth(addMonths(month, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7">
          {WEEKDAYS.map((d) => (
            <span key={d} className="py-1 text-center text-[0.6875rem] font-medium text-text-muted">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day) => {
            const isSelected = isSameDay(day, selected);
            const inMonth = isSameMonth(day, month);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => pick(day)}
                className={cn(
                  "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                  isSelected
                    ? "bg-accent font-semibold text-text-on-accent"
                    : inMonth
                      ? "text-text-primary hover:bg-surface-2"
                      : "text-text-muted/50 hover:bg-surface-2",
                  !isSelected && isToday(day) && "ring-1 ring-accent-border",
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => pick(new Date())}
          className="mt-3 w-full rounded-full py-2 text-center text-sm font-medium text-accent-text transition-colors hover:bg-accent-subtle"
        >
          Today
        </button>
      </PopoverContent>
    </Popover>
  );
}
