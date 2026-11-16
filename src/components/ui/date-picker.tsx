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
  addYears,
  subYears,
  isSameDay,
  isSameMonth,
  isToday,
  subDays,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => format(new Date(2000, i, 1), "MMM"));

/** "Today" / "Yesterday" for those two days, otherwise "Mon d, yyyy" (reference shows "Today"). */
function relativeLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isSameDay(date, subDays(new Date(), 1))) return "Yesterday";
  return format(date, "MMM d, yyyy");
}

/** Accepts/emits plain "yyyy-MM-dd" strings, matching the native date input it replaces. */
export function DatePicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Shown instead of today's date while the value is empty (optional dates). */
  placeholder?: string;
}) {
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : new Date();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(startOfMonth(selected));
  // "day" is the normal calendar grid; "month" lets you jump years first, then pick a
  // month, before dropping back into the day grid — the header label doubles as the
  // toggle between the two, and the same < > arrows step by year instead of by month.
  const [view, setView] = useState<"day" | "month">("day");

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  function pick(day: Date) {
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  function pickMonth(monthIndex: number) {
    setMonth(new Date(month.getFullYear(), monthIndex, 1));
    setView("day");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setMonth(startOfMonth(selected));
          setView("day");
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-13 w-full items-center gap-2.5 rounded-md bg-surface-2 px-4.5 text-[0.9375rem] text-text-primary outline-none focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Calendar size={16} className="shrink-0 text-text-muted" />
          {!value && placeholder ? (
            <span className="text-text-muted">{placeholder}</span>
          ) : (
            relativeLabel(selected)
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[21rem] p-4" align="start">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label={view === "day" ? "Previous month" : "Previous year"}
            onClick={() => setMonth(view === "day" ? subMonths(month, 1) : subYears(month, 1))}
            className="flex h-11 w-11 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => setView(view === "day" ? "month" : "day")}
            className="rounded-full px-2.5 py-1 text-lg font-extrabold text-text-primary transition-colors hover:bg-surface-2"
          >
            {view === "day" ? format(month, "MMMM yyyy") : format(month, "yyyy")}
          </button>
          <button
            type="button"
            aria-label={view === "day" ? "Next month" : "Next year"}
            onClick={() => setMonth(view === "day" ? addMonths(month, 1) : addYears(month, 1))}
            className="flex h-11 w-11 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {view === "month" ? (
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_NAMES.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => pickMonth(i)}
                className={cn(
                  "rounded-full py-2 text-sm transition-colors",
                  i === month.getMonth()
                    ? "bg-accent font-semibold text-text-on-accent"
                    : "text-text-primary hover:bg-surface-2",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((d, i) => (
                <span key={i} className="py-1 text-center text-xs font-bold text-text-secondary">
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
                      "mx-auto flex h-10 w-11 items-center justify-center rounded-[14px] text-sm font-semibold transition-colors",
                      isSelected
                        ? "bg-accent font-extrabold text-text-on-accent"
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
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
