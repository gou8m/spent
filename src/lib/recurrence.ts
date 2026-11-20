/**
 * How recurring items choose their dates. Pure functions, used by the generator, the calendar and the form.
 *
 * Dates are stored as a calendar day at UTC midnight, so all the arithmetic here is done in UTC: it gives the
 * same answer on every server and in every time zone (local-time maths slid a date back a day on machines
 * east of UTC).
 *
 * MONTHLY and YEARLY items normally keep the day of the month they started on (an SIP started on the 2nd
 * always lands on the 2nd; the 31st becomes the 30th in April and goes back to the 31st when it can).
 * Two other rules suit salary and bills that follow the calendar: the last day of the month, and the last
 * working day (the last Monday to Friday; public holidays are not considered).
 */

export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type DayRule = "DAY" | "MONTH_END" | "LAST_WORKING_DAY";

export const DAY_RULES: DayRule[] = ["DAY", "MONTH_END", "LAST_WORKING_DAY"];

export function isDayRule(value: string): value is DayRule {
  return (DAY_RULES as string[]).includes(value);
}

const DAY_MS = 24 * 60 * 60 * 1000;

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
const utcDay = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day));

/** The last Monday to Friday of the month that `monthStart` falls in. */
export function lastWorkingDayOfMonth(monthStart: Date): Date {
  const year = monthStart.getUTCFullYear();
  const month = monthStart.getUTCMonth();
  let day = utcDay(year, month, daysInMonth(year, month));
  while (day.getUTCDay() === 0 || day.getUTCDay() === 6) day = new Date(day.getTime() - DAY_MS);
  return day;
}

/** The date a rule lands on within the month of `monthStart`. */
export function dateInMonth(monthStart: Date, rule: DayRule, anchorDay: number): Date {
  const year = monthStart.getUTCFullYear();
  const month = monthStart.getUTCMonth();
  const length = daysInMonth(year, month);
  if (rule === "MONTH_END") return utcDay(year, month, length);
  if (rule === "LAST_WORKING_DAY") return lastWorkingDayOfMonth(monthStart);
  return utcDay(year, month, Math.min(anchorDay, length));
}

/** The first of the month that is `months` after the month of `date`. */
function monthsAfter(date: Date, months: number): Date {
  return utcDay(date.getUTCFullYear(), date.getUTCMonth() + months, 1);
}

/**
 * The first date a new item lands on. For the calendar-based rules that is the matching day of the start
 * date's month, or the next month if that day has already gone by.
 */
export function firstOccurrence(start: Date, frequency: RecurringFrequency, rule: DayRule): Date {
  if (frequency !== "MONTHLY" || rule === "DAY") return start;
  const startDay = utcDay(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const inStartMonth = dateInMonth(start, rule, start.getUTCDate());
  return inStartMonth >= startDay ? inStartMonth : dateInMonth(monthsAfter(start, 1), rule, start.getUTCDate());
}

/** The date after `date`, one cycle on. `anchorDay` is the day of the month the item started on. */
export function stepForward(date: Date, frequency: RecurringFrequency, interval: number, anchorDay: number, rule: DayRule = "DAY"): Date {
  switch (frequency) {
    case "DAILY":
      return new Date(date.getTime() + interval * DAY_MS);
    case "WEEKLY":
      return new Date(date.getTime() + interval * 7 * DAY_MS);
    case "MONTHLY":
      return dateInMonth(monthsAfter(date, interval), rule, anchorDay);
    case "YEARLY":
      return dateInMonth(monthsAfter(date, interval * 12), rule === "DAY" ? "DAY" : rule, anchorDay);
  }
}

/** Whole calendar months from `from` to `to` (negative when `to` is earlier). */
function monthDiff(from: Date, to: Date): number {
  return (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
}

/** True when the extra (bonus) amount is due on `date`: every `everyMonths` months, counting the start month as the first. */
export function bonusDue(startDate: Date, date: Date, everyMonths: number | null | undefined): boolean {
  if (!everyMonths || everyMonths < 1) return false;
  const monthsSinceStart = monthDiff(startDate, date);
  return monthsSinceStart >= 0 && (monthsSinceStart + 1) % everyMonths === 0;
}

/** The amount (minor units) for the occurrence on `date`: the regular amount, plus the bonus in bonus months. */
export function amountOn(rule: { amount: number; startDate: Date; bonusAmount: number | null; bonusEveryMonths: number | null }, date: Date): number {
  return rule.amount + (rule.bonusAmount && bonusDue(rule.startDate, date, rule.bonusEveryMonths) ? rule.bonusAmount : 0);
}
