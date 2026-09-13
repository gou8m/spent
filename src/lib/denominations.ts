/**
 * Real note/coin denominations per currency, largest first — used for the
 * optional "what physical cash do I have" breakdown on CASH-type accounts
 * (and on expense/income transactions against one). Only covers the
 * currencies already in `CURRENCIES` (lib/constants.ts); an unlisted
 * currency just means the breakdown UI has nothing to offer, which is a
 * safe, silent fallback rather than an error.
 */
export const CURRENCY_DENOMINATIONS: Record<string, number[]> = {
  USD: [100, 50, 20, 10, 5, 1, 0.25, 0.1, 0.05, 0.01],
  EUR: [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01],
  GBP: [50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01],
  INR: [500, 200, 100, 50, 20, 10, 5, 2, 1],
  JPY: [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1],
  CAD: [100, 50, 20, 10, 5, 2, 1, 0.25, 0.1, 0.05],
  AUD: [100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05],
  CHF: [1000, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05],
  CNY: [100, 50, 20, 10, 5, 1, 0.5, 0.1],
  SGD: [1000, 100, 50, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05],
  AED: [1000, 500, 200, 100, 50, 20, 10, 5, 1],
  BRL: [100, 50, 20, 10, 5, 2, 1, 0.5, 0.25, 0.1, 0.05],
  MXN: [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5],
  ZAR: [200, 100, 50, 20, 10, 5, 2, 1],
  KRW: [50000, 10000, 5000, 1000, 500, 100, 50, 10],
};

export function getDenominationsForCurrency(currency: string): number[] {
  return CURRENCY_DENOMINATIONS[currency] ?? [];
}

export type DenominationCounts = Record<string, number>;

/** Total value (in major units, e.g. dollars not cents) represented by a denomination breakdown. */
export function totalFromDenominations(counts: DenominationCounts): number {
  return Object.entries(counts).reduce((sum, [value, count]) => sum + Number(value) * (count || 0), 0);
}

/**
 * Adjusts a cash account's tracked breakdown by a transaction's denomination
 * counts. Deliberately NOT clamped at zero: this needs to be a perfect
 * inverse (subtracting a delta and then adding the same delta back must
 * return the exact original breakdown) so that editing or deleting a
 * transaction can cleanly reverse its effect — clamping would silently
 * discard information whenever a transaction spent a note the account
 * didn't have recorded, breaking that round-trip. A negative count that
 * results just means the tracked breakdown doesn't actually add up
 * (e.g. an expense recorded more 50s than the account had on file) — that's
 * surfaced as-is rather than hidden, since this is opt-in informational
 * tracking, not a strict inventory system.
 */
export function applyDenominationDelta(
  current: DenominationCounts | null | undefined,
  delta: DenominationCounts,
  direction: "add" | "subtract",
): DenominationCounts {
  const result: DenominationCounts = { ...(current ?? {}) };
  for (const [value, count] of Object.entries(delta)) {
    if (!count) continue;
    const existing = result[value] ?? 0;
    const next = direction === "add" ? existing + count : existing - count;
    if (next === 0) delete result[value];
    else result[value] = next;
  }
  return result;
}
