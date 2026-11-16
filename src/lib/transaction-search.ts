import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfWeek, endOfWeek, subDays, subMonths } from "date-fns";
import type { Prisma } from "@prisma/client";
import { toMinorUnits } from "@/lib/money";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_PATTERN = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

export interface ParsedSearch {
  /** Words that must appear in the title, note, category or account name. */
  terms: string[];
  /** Number-looking tokens, as minor units of the user's currency. A transaction matches a
   * number if its amount equals it OR the number text appears in its title/note. */
  numbers: { text: string; minor: number }[];
  /** Every date constraint found; a transaction must fall inside all of them. */
  ranges: { from: Date; to: Date }[];
}

function monthIndex(word: string) {
  return MONTHS.indexOf(word.slice(0, 3).toLowerCase());
}

/** A day/month with no year means the most recent such date: a future one is read as last year's. */
function dayInRecentYear(day: number, month: number, now: Date, year?: number) {
  let y = year ?? now.getFullYear();
  let d = new Date(y, month, day);
  if (year === undefined && d.getTime() > endOfDay(now).getTime()) {
    y -= 1;
    d = new Date(y, month, day);
  }
  return d.getMonth() === month ? d : null;
}

function monthInRecentYear(month: number, now: Date, year?: number) {
  let y = year ?? now.getFullYear();
  if (year === undefined && new Date(y, month, 1).getTime() > now.getTime()) y -= 1;
  return new Date(y, month, 1);
}

/** Turns what someone types in the search box into text terms plus amount and date
 * constraints, so "uber oct", "450", "₹1,200", "12/10", "oct 12" or "last month" all
 * work alongside plain merchant/note search. Pure and side-effect free. */
export function parseSearch(raw: string, currency: string, now: Date = new Date()): ParsedSearch {
  let rest = ` ${raw.toLowerCase().trim()} `;
  const ranges: ParsedSearch["ranges"] = [];

  // A handler returning null means "this looked like a date but is not one" (e.g. month 49),
  // so the text stays in the query instead of silently vanishing.
  const take = (pattern: RegExp, handler: (m: RegExpMatchArray) => unknown) => {
    const match = rest.match(pattern);
    if (!match) return;
    if (handler(match) === null) return;
    rest = rest.replace(match[0], " ");
  };
  const day = (d: Date | null) => (d ? ranges.push({ from: startOfDay(d), to: endOfDay(d) }) : null);

  take(/\s(\d{4})-(\d{1,2})-(\d{1,2})\s/, (m) => day(dayInRecentYear(+m[3], +m[2] - 1, now, +m[1])));
  take(/\s(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\s/, (m) => {
    const year = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : undefined;
    return day(dayInRecentYear(+m[1], +m[2] - 1, now, year)); // day/month order, matching the app's locale default
  });
  take(new RegExp(`\\s(\\d{1,2})(?:st|nd|rd|th)?\\s*${MONTH_PATTERN}(?:\\s+(\\d{4}))?\\s`), (m) =>
    day(dayInRecentYear(+m[1], monthIndex(m[2]), now, m[3] ? +m[3] : undefined)),
  );
  take(new RegExp(`\\s${MONTH_PATTERN}\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?(?=\\s)`), (m) =>
    day(dayInRecentYear(+m[2], monthIndex(m[1]), now, m[3] ? +m[3] : undefined)),
  );
  take(new RegExp(`\\s${MONTH_PATTERN}(?:\\s+(\\d{4}))?\\s`), (m) => {
    const start = monthInRecentYear(monthIndex(m[1]), now, m[2] ? +m[2] : undefined);
    ranges.push({ from: startOfMonth(start), to: endOfMonth(start) });
  });
  take(/\slast month\s/, () => {
    const d = subMonths(now, 1);
    ranges.push({ from: startOfMonth(d), to: endOfMonth(d) });
  });
  take(/\sthis month\s/, () => ranges.push({ from: startOfMonth(now), to: endOfMonth(now) }));
  take(/\sthis week\s/, () => ranges.push({ from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) }));
  take(/\sthis year\s/, () => ranges.push({ from: startOfYear(now), to: endOfYear(now) }));
  take(/\syesterday\s/, () => day(subDays(now, 1)));
  take(/\stoday\s/, () => day(now));
  take(/\s((?:19|20)\d{2})\s/, (m) => {
    const y = new Date(+m[1], 0, 1);
    ranges.push({ from: startOfYear(y), to: endOfYear(y) });
  });

  const terms: string[] = [];
  const numbers: ParsedSearch["numbers"] = [];
  for (const token of rest.split(/\s+/).filter(Boolean)) {
    const numeric = token.replace(/[₹$€£¥,]/g, "");
    if (/^\d+(\.\d+)?$/.test(numeric)) {
      numbers.push({ text: token, minor: toMinorUnits(Number(numeric), currency) });
    } else {
      terms.push(token);
    }
  }
  return { terms, numbers, ranges };
}

/** Prisma conditions (all must hold) for a parsed search. Text is matched
 * case-insensitively against the title, note, category and account names. */
export function searchConditions(raw: string, currency: string): Prisma.TransactionWhereInput[] {
  const { terms, numbers, ranges } = parseSearch(raw, currency);
  const conditions: Prisma.TransactionWhereInput[] = [];

  for (const term of terms) {
    conditions.push({
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { note: { contains: term, mode: "insensitive" } },
        { category: { name: { contains: term, mode: "insensitive" } } },
        { account: { name: { contains: term, mode: "insensitive" } } },
      ],
    });
  }
  for (const n of numbers) {
    conditions.push({
      OR: [
        { amount: n.minor },
        { title: { contains: n.text, mode: "insensitive" } },
        { note: { contains: n.text, mode: "insensitive" } },
      ],
    });
  }
  for (const r of ranges) conditions.push({ date: { gte: r.from, lte: r.to } });
  return conditions;
}
