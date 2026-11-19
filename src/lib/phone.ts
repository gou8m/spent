/**
 * Phone numbers follow the primary currency at the moment they are first entered: someone on INR types
 * 9999999999 and it is stored as "+91 99999 99999". The stored number keeps its own country code, so changing
 * the currency later never rewrites it; only a number typed without "+" picks up the then-current code.
 * Currencies shared by many countries (Euro, Swiss franc) have no default: those need a "+" number.
 */

/** Country dial code and the digit counts a national number may have (after the leading 0, if any). */
const COUNTRY: Record<string, { dial: string; lengths: number[] }> = {
  INR: { dial: "91", lengths: [10] },
  USD: { dial: "1", lengths: [10] },
  CAD: { dial: "1", lengths: [10] },
  GBP: { dial: "44", lengths: [10] },
  AUD: { dial: "61", lengths: [9] },
  SGD: { dial: "65", lengths: [8] },
  AED: { dial: "971", lengths: [9] },
  JPY: { dial: "81", lengths: [10] },
  CNY: { dial: "86", lengths: [11] },
  KRW: { dial: "82", lengths: [9, 10] },
  BRL: { dial: "55", lengths: [10, 11] },
  MXN: { dial: "52", lengths: [10] },
  ZAR: { dial: "27", lengths: [9] },
};

/** "+91" for INR, or null when the currency does not imply a country (EUR, CHF). */
export function dialCodeFor(currency: string): string | null {
  const c = COUNTRY[currency];
  return c ? `+${c.dial}` : null;
}

/** What to show in an empty phone box. */
export function phonePlaceholder(currency: string): string {
  return currency === "INR" ? "+91 99999 99999" : `${dialCodeFor(currency) ?? "+"} …`;
}

function format(dial: string, national: string): string {
  if (dial === "91") return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
  if (dial === "1" && national.length === 10) return `+1 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  return `+${dial} ${national}`;
}

/**
 * Cleans and formats a phone number. Returns "" for empty input, the formatted number, or null when it is not
 * a plausible number for `currency` (or, with a leading "+", for any country).
 */
export function normalizePhone(value: string, currency: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^\+?[\d\s()-]+$/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, "");

  const international = trimmed.startsWith("+") || digits.startsWith("00");
  if (international) {
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.length < 8 || digits.length > 15) return null;
    // A known country code with a matching length gets its usual spacing; anything else is kept as typed.
    for (const { dial, lengths } of Object.values(COUNTRY).sort((a, b) => b.dial.length - a.dial.length)) {
      if (digits.startsWith(dial) && lengths.includes(digits.length - dial.length)) return format(dial, digits.slice(dial.length));
    }
    return `+${digits}`;
  }

  const country = COUNTRY[currency];
  if (!country) return null;
  // Allow the leading 0 some people type, and the country code typed without "+" (919999999999).
  if (digits.startsWith("0")) digits = digits.slice(1);
  else if (digits.startsWith(country.dial) && country.lengths.includes(digits.length - country.dial.length)) digits = digits.slice(country.dial.length);
  if (!country.lengths.includes(digits.length)) return null;
  if (currency === "INR" && !/^[6-9]/.test(digits)) return null;
  return format(country.dial, digits);
}
