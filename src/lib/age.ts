/** Spent is for people aged 18 or over. Dates of birth travel as "yyyy-MM-dd" strings. */
export const MIN_AGE = 18;

const pad = (n: number) => String(n).padStart(2, "0");

/** The latest date of birth that is still 18 today, as yyyy-MM-dd (for a date input's `max`). */
export function latestAdultBirthDate(now: Date = new Date()): string {
  return `${now.getFullYear() - MIN_AGE}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Parses "yyyy-MM-dd" into a real calendar date, or null (rejects 2026-02-31 and the like). */
export function parseBirthDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? date : null;
}

/** Whole years between a date of birth and `now`. */
export function ageOn(dob: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dob.getUTCFullYear();
  const beforeBirthday = now.getMonth() < dob.getUTCMonth() || (now.getMonth() === dob.getUTCMonth() && now.getDate() < dob.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}

/** Error text for a bad date of birth, or null when it is a valid date and the person is 18 or over. */
export function birthDateError(value: string, now: Date = new Date()): string | null {
  const dob = parseBirthDate(value);
  if (!dob) return "Enter your date of birth";
  const age = ageOn(dob, now);
  if (age < MIN_AGE) return "Spent is for people aged 18 or over";
  if (age > 110) return "Check your date of birth";
  return null;
}

/** True on the person's birthday (29 February is celebrated on 28 February in other years). */
export function isBirthday(dob: Date | string, now: Date = new Date()): boolean {
  const d = typeof dob === "string" ? parseBirthDate(dob.slice(0, 10)) : dob;
  if (!d) return false;
  const month = d.getUTCMonth();
  let day = d.getUTCDate();
  const leap = new Date(now.getFullYear(), 1, 29).getMonth() === 1;
  if (month === 1 && day === 29 && !leap) day = 28;
  return now.getMonth() === month && now.getDate() === day;
}

/** Optional phone: 7 to 15 digits, with an optional leading + and common separators. Returns the cleaned number, "" for empty, or null if invalid. */
export function cleanPhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^\+?[\d\s()-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return (trimmed.startsWith("+") ? "+" : "") + digits;
}
