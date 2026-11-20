import { decimalsForCurrency } from "@/lib/money";

/**
 * Amounts are typed with grouping commas that follow the currency: rupees group 3 then 2 (1,12,34,568.00),
 * everything else in threes (1,234,567.00). The value kept in state is always the plain number text
 * ("11234568.5"); commas exist only in what is shown. The decimal point is always ".".
 */

const MAX_INTEGER_DIGITS = 12;

export function groupDigits(integer: string, currency: string): string {
  if (currency === "INR") {
    if (integer.length <= 3) return integer;
    return `${integer.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${integer.slice(-3)}`;
  }
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Whatever was typed or pasted, reduced to a valid plain amount for `currency` ("1,23,456.7x" gives "123456.7"). */
export function sanitizeAmount(typed: string, currency: string): string {
  const decimals = decimalsForCurrency(currency);
  const cleaned = typed.replace(/[^0-9.]/g, "");
  const dot = cleaned.indexOf(".");
  let integer = (dot === -1 ? cleaned : cleaned.slice(0, dot)).replace(/\./g, "");
  integer = integer.replace(/^0+(?=\d)/, "").slice(0, MAX_INTEGER_DIGITS);
  if (decimals === 0 || dot === -1) return integer;
  const fraction = cleaned.slice(dot + 1).replace(/\./g, "").slice(0, decimals);
  return `${integer === "" ? "0" : integer}.${fraction}`;
}

/** The plain amount ("1234567.5") as shown in the box ("12,34,567.5" for rupees). */
export function formatAmountText(raw: string, currency: string): string {
  if (!raw) return "";
  const dot = raw.indexOf(".");
  if (dot === -1) return groupDigits(raw, currency);
  return `${groupDigits(raw.slice(0, dot), currency)}.${raw.slice(dot + 1)}`;
}

const isSignificant = (ch: string) => /[0-9.]/.test(ch);

/** Where the caret belongs in `shown` after `typedBeforeCaret` characters (digits and the point) precede it. */
export function caretAfter(shown: string, significantBefore: number): number {
  if (significantBefore <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < shown.length; i++) {
    if (isSignificant(shown[i])) seen++;
    if (seen === significantBefore) return i + 1;
  }
  return shown.length;
}

export function countSignificant(text: string): number {
  let n = 0;
  for (const ch of text) if (isSignificant(ch)) n++;
  return n;
}
