import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, differenceInCalendarDays, isValid, parse } from "date-fns";

export const STATEMENT_RANGES = ["last-month", "3-months", "6-months", "custom"] as const;
export type StatementRange = (typeof STATEMENT_RANGES)[number];

/** A statement over a year is almost certainly a mistake and would be a very long file. */
const MAX_SPAN_DAYS = 366;
/** Hard cap on rows in one PDF; the statement says so when it is hit. */
export const STATEMENT_ROW_LIMIT = 5000;

export function resolveStatementRange(
  range: string,
  from: string | null,
  to: string | null,
  now: Date = new Date(),
): { start: Date; end: Date } | { error: string } {
  if (range === "last-month") {
    const m = subMonths(now, 1);
    return { start: startOfMonth(m), end: endOfMonth(m) };
  }
  if (range === "3-months") return { start: startOfDay(subMonths(now, 3)), end: endOfDay(now) };
  if (range === "6-months") return { start: startOfDay(subMonths(now, 6)), end: endOfDay(now) };
  if (range === "custom") {
    const start = from ? parse(from, "yyyy-MM-dd", new Date()) : null;
    const end = to ? parse(to, "yyyy-MM-dd", new Date()) : null;
    if (!start || !end || !isValid(start) || !isValid(end)) return { error: "Choose a start and end date" };
    if (start > end) return { error: "The start date must be before the end date" };
    if (differenceInCalendarDays(end, start) > MAX_SPAN_DAYS) return { error: "Choose a range of one year or less" };
    return { start: startOfDay(start), end: endOfDay(end) };
  }
  return { error: "Unknown range" };
}
