/**
 * Major national holidays and festivals, keyed by currency — feeds the
 * "upcoming holiday" notification (see getNotifications). Scoped to INR and
 * USD only, per explicit request; a currency with no entry here simply gets
 * no holiday notifications rather than a guessed-at list.
 *
 * US holidays are entirely rule-based (fixed date, or "nth weekday of
 * month") and stay accurate forever. Indian festivals are a mix: a handful
 * are fixed-date, but most (Holi, Diwali, Eid, etc.) follow the Hindu
 * lunisolar or Islamic lunar calendar and shift every year — there's no
 * formula for those, so their dates are sourced from published calendars
 * per year below. Extend `lookupDate`'s table as new years approach; a year
 * missing from the table just produces no notification that year rather
 * than a guessed date. Currently populated through 2027 (2026 fully
 * verified; 2027 mostly verified, Eid dates omitted for 2027 since sources
 * disagreed on the month).
 */

export interface HolidayOccurrence {
  id: string;
  name: string;
  date: Date;
}

interface HolidayDef {
  id: string;
  name: string;
  getDate: (year: number) => Date | null;
}

function fixedDate(month: number, day: number) {
  return (year: number) => new Date(year, month, day);
}

/** The Nth occurrence of a weekday in a month (e.g. "3rd Monday of January"). */
function nthWeekday(month: number, weekday: number, n: number) {
  return (year: number) => {
    const first = new Date(year, month, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month, 1 + offset + (n - 1) * 7);
  };
}

/** The last occurrence of a weekday in a month (e.g. "last Monday of May"). */
function lastWeekday(month: number, weekday: number) {
  return (year: number) => {
    const last = new Date(year, month + 1, 0);
    const offset = (last.getDay() - weekday + 7) % 7;
    return new Date(year, month, last.getDate() - offset);
  };
}

function lookupDate(datesByYear: Record<number, [month: number, day: number]>) {
  return (year: number) => {
    const d = datesByYear[year];
    return d ? new Date(year, d[0], d[1]) : null;
  };
}

export const INR_HOLIDAYS: HolidayDef[] = [
  { id: "new-year", name: "New Year's Day", getDate: fixedDate(0, 1) },
  { id: "republic-day", name: "Republic Day", getDate: fixedDate(0, 26) },
  { id: "holi", name: "Holi", getDate: lookupDate({ 2026: [2, 4], 2027: [2, 22] }) },
  { id: "eid-al-fitr", name: "Eid al-Fitr", getDate: lookupDate({ 2026: [2, 20] }) },
  { id: "eid-al-adha", name: "Eid al-Adha", getDate: lookupDate({ 2026: [4, 27] }) },
  { id: "independence-day", name: "Independence Day", getDate: fixedDate(7, 15) },
  { id: "raksha-bandhan", name: "Raksha Bandhan", getDate: lookupDate({ 2026: [7, 28], 2027: [7, 17] }) },
  { id: "janmashtami", name: "Janmashtami", getDate: lookupDate({ 2026: [8, 4], 2027: [7, 25] }) },
  { id: "ganesh-chaturthi", name: "Ganesh Chaturthi", getDate: lookupDate({ 2026: [8, 14], 2027: [8, 4] }) },
  { id: "gandhi-jayanti", name: "Gandhi Jayanti", getDate: fixedDate(9, 2) },
  { id: "dussehra", name: "Dussehra", getDate: lookupDate({ 2026: [9, 20], 2027: [9, 9] }) },
  { id: "diwali", name: "Diwali", getDate: lookupDate({ 2026: [10, 8], 2027: [9, 29] }) },
  { id: "guru-nanak-jayanti", name: "Guru Nanak Jayanti", getDate: lookupDate({ 2026: [10, 24], 2027: [10, 14] }) },
  { id: "christmas", name: "Christmas", getDate: fixedDate(11, 25) },
];

export const USD_HOLIDAYS: HolidayDef[] = [
  { id: "new-year", name: "New Year's Day", getDate: fixedDate(0, 1) },
  { id: "mlk-day", name: "Martin Luther King Jr. Day", getDate: nthWeekday(0, 1, 3) },
  { id: "presidents-day", name: "Presidents' Day", getDate: nthWeekday(1, 1, 3) },
  { id: "memorial-day", name: "Memorial Day", getDate: lastWeekday(4, 1) },
  { id: "juneteenth", name: "Juneteenth", getDate: fixedDate(5, 19) },
  { id: "independence-day", name: "Independence Day", getDate: fixedDate(6, 4) },
  { id: "labor-day", name: "Labor Day", getDate: nthWeekday(8, 1, 1) },
  { id: "halloween", name: "Halloween", getDate: fixedDate(9, 31) },
  { id: "veterans-day", name: "Veterans Day", getDate: fixedDate(10, 11) },
  { id: "thanksgiving", name: "Thanksgiving", getDate: nthWeekday(10, 4, 4) },
  { id: "christmas", name: "Christmas", getDate: fixedDate(11, 25) },
];

const HOLIDAYS_BY_CURRENCY: Record<string, HolidayDef[]> = {
  INR: INR_HOLIDAYS,
  USD: USD_HOLIDAYS,
};

const HOLIDAY_WINDOW_DAYS = 7;

/**
 * Live-computed, same "recompute, don't store" pattern as every other
 * notification category — checks each holiday's occurrence in the current
 * year and (near year-end) next year too, returning any that fall within
 * the upcoming window.
 */
export function getUpcomingHolidays(currency: string, now: Date = new Date()): HolidayOccurrence[] {
  const defs = HOLIDAYS_BY_CURRENCY[currency];
  if (!defs) return [];

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + HOLIDAY_WINDOW_DAYS);

  const occurrences: HolidayOccurrence[] = [];
  for (const def of defs) {
    for (const year of [now.getFullYear(), now.getFullYear() + 1]) {
      const date = def.getDate(year);
      if (!date || date < today || date > windowEnd) continue;
      occurrences.push({ id: `${def.id}:${year}`, name: def.name, date });
    }
  }
  return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
}
