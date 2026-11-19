/**
 * Holidays and festivals shown on the Calendar (and, for the major ones, in notifications), keyed by
 * currency. Scoped to INR and USD; a currency with no entry simply has none.
 *
 * US holidays are rule-based (fixed date, or "nth weekday of month") and stay accurate forever.
 *
 * India: fixed national days are rules; every festival that follows the lunisolar calendar has a
 * date per year (2026 and 2027), cross-checked between Telugu panchangam calendars (the TTD-style
 * Telugu festival list: Bhogi, Sankranti, Ugadi, Varalakshmi Vratam, Vinayaka Chavithi, Dasara, Deepavali,
 * Karthika Pournami, Mukkoti Ekadashi...), the central government's gazetted / restricted holiday list and
 * timeanddate.com. Moon-dependent dates (Eid, Muharram, Milad-un-Nabi) and the few dates where sources
 * differ by a day are listed in `approxYears` and shown as "may shift by a day"; they never trigger a
 * notification. Extend the per-year tables as 2028 approaches; a year missing from a table shows nothing
 * rather than a guessed date.
 */

export interface HolidayOccurrence {
  id: string;
  name: string;
  date: Date;
  kind: "public" | "festival";
  /** The date may be a day off (moon sighting, or sources disagree). */
  approx: boolean;
  wish?: string;
}

interface HolidayDef {
  id: string;
  name: string;
  getDate: (year: number) => Date | null;
  /** A public (gazetted or national) holiday, as opposed to a festival. */
  kind?: "public" | "festival";
  /** Shown on the Calendar only: too minor to send a notification for. */
  calendarOnly?: boolean;
  /** Years whose date depends on the moon or differs between sources by a day. */
  approxYears?: number[];
  /** What the Home greeting says on this day ("Happy Sankranthi"). Days without one only show on the calendar. */
  wish?: string;
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

// [month (0 = January), day] per year.
const PUBLIC = "public" as const;
const FESTIVAL = "festival" as const;

export const INR_HOLIDAYS: HolidayDef[] = [
  { id: "new-year", name: "New Year's Day", wish: "Happy New Year", kind: FESTIVAL, getDate: fixedDate(0, 1) },
  { id: "bhogi", name: "Bhogi", wish: "Happy Bhogi", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [0, 13], 2027: [0, 14] }) },
  { id: "makar-sankranti", name: "Makar Sankranti / Pongal", wish: "Happy Sankranthi", kind: FESTIVAL, getDate: lookupDate({ 2026: [0, 14], 2027: [0, 15] }) },
  { id: "kanuma", name: "Kanuma", wish: "Happy Kanuma", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [0, 15], 2027: [0, 16] }) },
  { id: "republic-day", name: "Republic Day", wish: "Happy Republic Day", kind: PUBLIC, getDate: fixedDate(0, 26) },
  { id: "vasant-panchami", name: "Vasant Panchami", wish: "Happy Vasant Panchami", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [0, 23], 2027: [1, 11] }) },
  { id: "ratha-saptami", name: "Ratha Saptami", wish: "Happy Ratha Saptami", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [0, 25], 2027: [1, 13] }) },
  { id: "maha-shivaratri", name: "Maha Shivaratri", wish: "Happy Maha Shivaratri", kind: FESTIVAL, getDate: lookupDate({ 2026: [1, 15], 2027: [2, 6] }) },
  { id: "holi", name: "Holi", wish: "Happy Holi", kind: PUBLIC, getDate: lookupDate({ 2026: [2, 4], 2027: [2, 22] }) },
  { id: "ugadi", name: "Ugadi (Telugu New Year)", wish: "Happy Ugadi", kind: FESTIVAL, getDate: lookupDate({ 2026: [2, 19], 2027: [3, 7] }) },
  { id: "eid-al-fitr", name: "Eid al-Fitr", wish: "Eid Mubarak", kind: PUBLIC, approxYears: [2026, 2027], getDate: lookupDate({ 2026: [2, 21], 2027: [2, 10] }) },
  { id: "rama-navami", name: "Sri Rama Navami", wish: "Happy Sri Rama Navami", kind: PUBLIC, getDate: lookupDate({ 2026: [2, 26], 2027: [3, 15] }) },
  { id: "mahavir-jayanti", name: "Mahavir Jayanti", wish: "Happy Mahavir Jayanti", kind: PUBLIC, calendarOnly: true, getDate: lookupDate({ 2026: [2, 31], 2027: [3, 19] }) },
  { id: "good-friday", name: "Good Friday", kind: PUBLIC, getDate: lookupDate({ 2026: [3, 3], 2027: [2, 26] }) },
  { id: "ambedkar-jayanti", name: "Ambedkar Jayanti", kind: PUBLIC, calendarOnly: true, getDate: fixedDate(3, 14) },
  { id: "akshaya-tritiya", name: "Akshaya Tritiya", wish: "Happy Akshaya Tritiya", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [3, 19], 2027: [4, 9] }) },
  { id: "buddha-purnima", name: "Buddha Purnima", wish: "Happy Buddha Purnima", kind: PUBLIC, calendarOnly: true, getDate: lookupDate({ 2026: [4, 1], 2027: [4, 20] }) },
  { id: "hanuman-jayanti", name: "Hanuman Jayanti", wish: "Happy Hanuman Jayanti", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [4, 12], 2027: [4, 31] }) },
  { id: "eid-al-adha", name: "Eid al-Adha (Bakrid)", wish: "Eid Mubarak", kind: PUBLIC, approxYears: [2026, 2027], getDate: lookupDate({ 2026: [4, 28], 2027: [4, 17] }) },
  { id: "muharram", name: "Muharram", kind: PUBLIC, calendarOnly: true, approxYears: [2026, 2027], getDate: lookupDate({ 2026: [5, 26], 2027: [5, 16] }) },
  { id: "independence-day", name: "Independence Day", wish: "Happy Independence Day", kind: PUBLIC, getDate: fixedDate(7, 15) },
  { id: "onam", name: "Onam", wish: "Happy Onam", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [7, 26], 2027: [8, 12] }) },
  { id: "milad-un-nabi", name: "Milad-un-Nabi", kind: PUBLIC, calendarOnly: true, approxYears: [2026, 2027], getDate: lookupDate({ 2026: [7, 26], 2027: [7, 15] }) },
  { id: "varalakshmi-vratam", name: "Varalakshmi Vratam", wish: "Happy Varalakshmi Vratam", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [7, 28], 2027: [7, 13] }) },
  { id: "raksha-bandhan", name: "Raksha Bandhan", wish: "Happy Raksha Bandhan", kind: FESTIVAL, getDate: lookupDate({ 2026: [7, 28], 2027: [7, 17] }) },
  { id: "janmashtami", name: "Sri Krishna Janmashtami", wish: "Happy Janmashtami", kind: PUBLIC, getDate: lookupDate({ 2026: [8, 4], 2027: [7, 25] }) },
  { id: "ganesh-chaturthi", name: "Vinayaka Chavithi (Ganesh Chaturthi)", wish: "Happy Vinayaka Chavithi", kind: FESTIVAL, getDate: lookupDate({ 2026: [8, 14], 2027: [8, 4] }) },
  { id: "gandhi-jayanti", name: "Gandhi Jayanti", kind: PUBLIC, getDate: fixedDate(9, 2) },
  { id: "navaratri", name: "Sharad Navaratri begins", wish: "Happy Navaratri", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [9, 11], 2027: [8, 30] }) },
  { id: "dussehra", name: "Dasara (Vijayadashami)", wish: "Happy Dasara", kind: PUBLIC, approxYears: [2027], getDate: lookupDate({ 2026: [9, 20], 2027: [9, 9] }) },
  { id: "naraka-chaturdashi", name: "Naraka Chaturdashi", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [10, 8], 2027: [9, 28] }) },
  { id: "diwali", name: "Deepavali (Diwali)", wish: "Happy Deepavali", kind: PUBLIC, getDate: lookupDate({ 2026: [10, 8], 2027: [9, 29] }) },
  { id: "nagula-chavithi", name: "Nagula Chavithi", wish: "Happy Nagula Chavithi", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [10, 13], 2027: [10, 2] }) },
  { id: "karthika-pournami", name: "Karthika Pournami", wish: "Happy Karthika Pournami", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [10, 24], 2027: [10, 14] }) },
  { id: "guru-nanak-jayanti", name: "Guru Nanak Jayanti", wish: "Happy Guru Nanak Jayanti", kind: PUBLIC, getDate: lookupDate({ 2026: [10, 24], 2027: [10, 14] }) },
  { id: "vaikuntha-ekadashi", name: "Vaikuntha (Mukkoti) Ekadashi", wish: "Happy Vaikuntha Ekadashi", kind: FESTIVAL, calendarOnly: true, getDate: lookupDate({ 2026: [11, 20], 2027: [11, 9] }) },
  { id: "christmas", name: "Christmas", wish: "Merry Christmas", kind: PUBLIC, getDate: fixedDate(11, 25) },
];

export const USD_HOLIDAYS: HolidayDef[] = [
  { id: "new-year", name: "New Year's Day", wish: "Happy New Year", getDate: fixedDate(0, 1) },
  { id: "mlk-day", kind: PUBLIC, name: "Martin Luther King Jr. Day", getDate: nthWeekday(0, 1, 3) },
  { id: "presidents-day", kind: PUBLIC, name: "Presidents' Day", getDate: nthWeekday(1, 1, 3) },
  { id: "memorial-day", kind: PUBLIC, name: "Memorial Day", getDate: lastWeekday(4, 1) },
  { id: "juneteenth", kind: PUBLIC, name: "Juneteenth", getDate: fixedDate(5, 19) },
  { id: "independence-day", name: "Independence Day", wish: "Happy 4th of July", getDate: fixedDate(6, 4) },
  { id: "labor-day", kind: PUBLIC, name: "Labor Day", getDate: nthWeekday(8, 1, 1) },
  { id: "halloween", name: "Halloween", wish: "Happy Halloween", kind: FESTIVAL, calendarOnly: true, getDate: fixedDate(9, 31) },
  { id: "veterans-day", kind: PUBLIC, name: "Veterans Day", getDate: fixedDate(10, 11) },
  { id: "thanksgiving", kind: PUBLIC, name: "Thanksgiving", wish: "Happy Thanksgiving", getDate: nthWeekday(10, 4, 4) },
  { id: "christmas", name: "Christmas", wish: "Merry Christmas", getDate: fixedDate(11, 25) },
];

const HOLIDAYS_BY_CURRENCY: Record<string, HolidayDef[]> = {
  INR: INR_HOLIDAYS,
  USD: USD_HOLIDAYS,
};

const HOLIDAY_WINDOW_DAYS = 1;

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
      if (def.calendarOnly || def.approxYears?.includes(year)) continue; // too minor, or the date may be a day off
      const date = def.getDate(year);
      if (!date || date < today || date > windowEnd) continue;
      occurrences.push({ id: `${def.id}:${year}`, name: def.name, date, kind: def.kind ?? "public", approx: false, wish: def.wish });
    }
  }
  return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Every holiday that falls between two dates (inclusive), for the calendar. */
export function getHolidaysInRange(currency: string, from: Date, to: Date): HolidayOccurrence[] {
  const defs = HOLIDAYS_BY_CURRENCY[currency];
  if (!defs) return [];
  const occurrences: HolidayOccurrence[] = [];
  for (let year = from.getFullYear(); year <= to.getFullYear(); year++) {
    for (const def of defs) {
      const date = def.getDate(year);
      if (!date || date < from || date > to) continue;
      occurrences.push({ id: `${def.id}:${year}`, name: def.name, date, kind: def.kind ?? "public", approx: !!def.approxYears?.includes(year), wish: def.wish });
    }
  }
  return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
}
