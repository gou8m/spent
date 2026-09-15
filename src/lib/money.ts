/**
 * All monetary values in this app are integers in minor units (e.g. cents for
 * USD, paise for INR) — never floats. These helpers are the only place that
 * should convert between minor units and display strings.
 */

const currencyDecimals: Record<string, number> = {
  JPY: 0,
  KRW: 0,
  VND: 0,
  CLP: 0,
  BHD: 3,
  KWD: 3,
  OMR: 3,
};

export function decimalsForCurrency(currency: string): number {
  return currencyDecimals[currency] ?? 2;
}

/** Grouping/decimal-separator convention is a property of the *locale*, not the
 * currency, in `Intl.NumberFormat` — "en-US" formatting for INR gives the wrong
 * grouping (₹1,000,000.00) instead of the Indian system (₹10,00,000.00). Each
 * currency maps to a representative locale for its own country's convention;
 * English-language locale variants ("en-XX") are chosen wherever available so
 * digits stay in Western Arabic numerals, matching the rest of this app's UI. */
const CURRENCY_LOCALES: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  INR: "en-IN",
  JPY: "ja-JP",
  CAD: "en-CA",
  AUD: "en-AU",
  CHF: "de-CH",
  CNY: "zh-CN",
  SGD: "en-SG",
  AED: "en-AE",
  BRL: "pt-BR",
  MXN: "es-MX",
  ZAR: "en-ZA",
  KRW: "ko-KR",
};

function localeForCurrency(currency: string): string {
  return CURRENCY_LOCALES[currency] ?? "en-US";
}

/** Convert a major-unit amount (e.g. "12.50") to integer minor units (1250). */
export function toMinorUnits(major: number, currency: string): number {
  const decimals = decimalsForCurrency(currency);
  return Math.round(major * 10 ** decimals);
}

/** Convert integer minor units (1250) back to major units (12.5). */
export function toMajorUnits(minor: number, currency: string): number {
  const decimals = decimalsForCurrency(currency);
  return minor / 10 ** decimals;
}

export interface FormatMoneyOptions {
  signDisplay?: "auto" | "always" | "never" | "exceptZero";
  compact?: boolean;
}

/** Format integer minor units as a locale + currency aware display string.
 * `locale` defaults to the currency's own native convention (see
 * `CURRENCY_LOCALES`) — pass one explicitly only to override that. */
export function formatMoney(
  minorUnits: number,
  currency: string,
  locale?: string,
  options: FormatMoneyOptions = {},
): string {
  const major = toMajorUnits(minorUnits, currency);
  try {
    return new Intl.NumberFormat(locale ?? localeForCurrency(currency), {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      signDisplay: options.signDisplay ?? "auto",
      notation: options.compact ? "compact" : "standard",
      minimumFractionDigits: options.compact ? undefined : decimalsForCurrency(currency),
      maximumFractionDigits: options.compact ? 1 : decimalsForCurrency(currency),
    }).format(major);
  } catch {
    // Unknown currency code — fall back to a plain number with the code appended.
    return `${major.toFixed(decimalsForCurrency(currency))} ${currency}`;
  }
}

export function formatSignedMoney(
  minorUnits: number,
  currency: string,
  direction: "INCOME" | "EXPENSE" | "TRANSFER",
  locale?: string,
): string {
  if (direction === "TRANSFER") return formatMoney(minorUnits, currency, locale);
  const signed = direction === "EXPENSE" ? -Math.abs(minorUnits) : Math.abs(minorUnits);
  return formatMoney(signed, currency, locale, { signDisplay: "exceptZero" });
}

/** Safe integer-cents arithmetic — avoids binary-float rounding errors. */
export const money = {
  add: (a: number, b: number) => a + b,
  subtract: (a: number, b: number) => a - b,
  sum: (values: number[]) => values.reduce((total, v) => total + v, 0),
  percentOf: (part: number, whole: number) => (whole === 0 ? 0 : (part / whole) * 100),
};
