"use client";

import { useState } from "react";
import { addMonths, endOfMonth, endOfWeek, eachDayOfInterval, format, isSameDay, isSameMonth, parse, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = Array.from({ length: 12 }, (_, i) => format(new Date(2000, i, 1), "MMM"));
const MIN_YEAR = 1900;
const YEARS_PER_PAGE = 12;

const toDate = (iso: string) => (iso ? parse(iso, "yyyy-MM-dd", new Date()) : null);
const toIso = (d: Date) => format(d, "yyyy-MM-dd");

/** Digits typed so far, shown as DD/MM/YYYY. */
function maskTyped(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** A complete, real date typed as DD/MM/YYYY, as yyyy-MM-dd, or "". */
function typedToIso(text: string) {
  if (text.length !== 10) return "";
  const date = parse(text, "dd/MM/yyyy", new Date());
  if (Number.isNaN(date.getTime()) || format(date, "dd/MM/yyyy") !== text) return "";
  if (date.getFullYear() < MIN_YEAR || date > new Date()) return "";
  return toIso(date);
}

/**
 * Date of birth: type it with the number keypad (DD/MM/YYYY) or open the calendar. In the calendar the
 * month name and the year are separate buttons: tap the month for a grid of months, the year for a grid of years.
 * Values are plain "yyyy-MM-dd" strings ("" until a complete, valid date is entered).
 */
export function BirthDateField({
  id,
  value,
  onChange,
  max,
  error,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Latest allowed date, yyyy-MM-dd. */
  max: string;
  error?: boolean;
}) {
  const maxDate = toDate(max) ?? new Date();
  const selected = toDate(value);
  const [text, setText] = useState(selected ? format(selected, "dd/MM/yyyy") : "");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"day" | "month" | "year">("day");
  const [month, setMonth] = useState(startOfMonth(selected ?? maxDate));
  const [yearPage, setYearPage] = useState(0);

  const maxYear = maxDate.getFullYear();
  const pageStart = (year: number) => maxYear - Math.floor((maxYear - year) / YEARS_PER_PAGE) * YEARS_PER_PAGE - (YEARS_PER_PAGE - 1);

  function handleTyped(raw: string) {
    const masked = maskTyped(raw);
    setText(masked);
    onChange(typedToIso(masked));
  }

  function choose(day: Date) {
    setText(format(day, "dd/MM/yyyy"));
    onChange(toIso(day));
    setOpen(false);
  }

  function openChanged(next: boolean) {
    setOpen(next);
    if (next) {
      const base = selected ?? maxDate;
      setMonth(startOfMonth(base));
      setYearPage(pageStart(base.getFullYear()));
      setView("day");
    }
  }

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  const canNextMonth = addMonths(month, 1) <= maxDate;
  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPage + i);

  const arrow = "flex h-11 w-11 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3 disabled:opacity-30";
  const headBtn = "flex items-center gap-1 rounded-full px-3 py-1.5 text-lg font-extrabold text-text-primary transition-colors hover:bg-surface-2";

  return (
    <Popover open={open} onOpenChange={openChanged}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            "flex h-13 w-full items-center rounded-md bg-surface-2 pl-4.5 pr-1.5 focus-within:bg-surface focus-within:ring-2 focus-within:ring-accent",
            error && "ring-2 ring-error",
          )}
        >
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            placeholder="DD/MM/YYYY"
            value={text}
            onChange={(e) => handleTyped(e.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent font-numeric text-[0.9375rem] text-text-primary outline-none placeholder:text-text-muted"
          />
          <PopoverTrigger asChild>
            <button type="button" aria-label="Open calendar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-3">
              <Calendar size={18} strokeWidth={2} />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>

      <PopoverContent className="w-[21rem] p-4" align="start">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label={view === "day" ? "Previous month" : view === "year" ? "Earlier years" : "Previous year"}
            disabled={view === "year" && yearPage <= MIN_YEAR}
            onClick={() => (view === "day" ? setMonth(subMonths(month, 1)) : view === "year" ? setYearPage(yearPage - YEARS_PER_PAGE) : setMonth(new Date(month.getFullYear() - 1, month.getMonth(), 1)))}
            className={arrow}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setView(view === "month" ? "day" : "month")} className={headBtn}>
              {format(month, "MMMM")}
              <ChevronDown size={16} className={cn("transition-transform", view === "month" && "rotate-180")} />
            </button>
            <button
              type="button"
              onClick={() => {
                setYearPage(pageStart(month.getFullYear()));
                setView(view === "year" ? "day" : "year");
              }}
              className={headBtn}
            >
              {month.getFullYear()}
              <ChevronDown size={16} className={cn("transition-transform", view === "year" && "rotate-180")} />
            </button>
          </div>
          <button
            type="button"
            aria-label={view === "day" ? "Next month" : view === "year" ? "Later years" : "Next year"}
            disabled={view === "day" ? !canNextMonth : view === "year" ? yearPage + YEARS_PER_PAGE > maxYear : month.getFullYear() >= maxYear}
            onClick={() => (view === "day" ? setMonth(addMonths(month, 1)) : view === "year" ? setYearPage(yearPage + YEARS_PER_PAGE) : setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1)))}
            className={arrow}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {view === "month" && (
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((name, i) => {
              const disabled = month.getFullYear() === maxYear && i > maxDate.getMonth();
              return (
                <button
                  key={name}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setMonth(new Date(month.getFullYear(), i, 1));
                    setView("day");
                  }}
                  className={cn(
                    "rounded-full py-2.5 text-sm transition-colors disabled:opacity-30",
                    i === month.getMonth() ? "bg-accent font-semibold text-text-on-accent" : "text-text-primary hover:bg-surface-2",
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}

        {view === "year" && (
          <div className="grid grid-cols-3 gap-1.5">
            {years.map((year) => {
              const disabled = year > maxYear || year < MIN_YEAR;
              return (
                <button
                  key={year}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const capped = new Date(year, month.getMonth(), 1);
                    setMonth(capped > maxDate ? startOfMonth(maxDate) : capped);
                    setView("day");
                  }}
                  className={cn(
                    "rounded-full py-2.5 text-sm transition-colors disabled:opacity-30",
                    year === month.getFullYear() ? "bg-accent font-semibold text-text-on-accent" : "text-text-primary hover:bg-surface-2",
                  )}
                >
                  {year}
                </button>
              );
            })}
          </div>
        )}

        {view === "day" && (
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
                const isSelected = !!selected && isSameDay(day, selected);
                const inMonth = isSameMonth(day, month);
                const disabled = day > maxDate;
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => choose(day)}
                    className={cn(
                      "mx-auto flex h-10 w-11 items-center justify-center rounded-[14px] text-sm font-semibold transition-colors disabled:opacity-25",
                      isSelected ? "bg-accent font-extrabold text-text-on-accent" : inMonth ? "text-text-primary hover:bg-surface-2" : "text-text-muted/50 hover:bg-surface-2",
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
