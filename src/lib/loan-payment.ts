import { computeLoan, type LoanPaymentInput, type LoanState, type LoanTerms } from "@/lib/loan-math";
import { MAX_MINOR_UNITS, formatMoney } from "@/lib/money";

/**
 * Checks and previews a payment made outside Spent (cash, or someone else paid): it has a date and an amount but
 * no transaction, so no account moves. Pure functions, used by the server action and by the form's preview.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** People can be up to 14 hours ahead of the server's UTC clock: their "today" may already be tomorrow here. */
const AHEAD_MS = 14 * 60 * 60 * 1000;

/** Which calendar day a date is, counted in UTC (dates are stored as a day at UTC midnight). */
export const dayIndex = (d: Date) => Math.floor(d.getTime() / DAY_MS);
/** The same day at UTC midnight, the form dates are stored in. */
export const toUtcMidnight = (d: Date) => new Date(dayIndex(d) * DAY_MS);
/** The latest day a payment or start date may carry right now, wherever the person is. */
export const latestAllowedDay = (now: Date = new Date()) => dayIndex(new Date(now.getTime() + AHEAD_MS));

export interface OutsidePayment {
  date: Date;
  amount: number;
}

const PREVIEW_KEY = "preview";

/** The loan as it would be after the payment, and how the payment splits: interest first, then the amount borrowed. */
export function previewOutsidePayment(
  terms: LoanTerms,
  existing: LoanPaymentInput[],
  payment: OutsidePayment,
  asOf: Date = new Date(),
): { state: LoanState; toInterest: number; toPrincipal: number } {
  const state = computeLoan(terms, [...existing, { ...payment, transactionId: PREVIEW_KEY }], asOf);
  const event = state.events.find((e) => e.kind === "PAYMENT" && e.transactionId === PREVIEW_KEY);
  return {
    state,
    toInterest: event && event.kind === "PAYMENT" ? event.toInterest : 0,
    toPrincipal: event && event.kind === "PAYMENT" ? event.toPrincipal : 0,
  };
}

/** Why a payment cannot be recorded, or null when it can. */
export function checkOutsidePayment(
  terms: LoanTerms,
  existing: LoanPaymentInput[],
  payment: OutsidePayment,
  currency: string,
  now: Date = new Date(),
): string | null {
  if (!Number.isFinite(payment.amount) || payment.amount <= 0) return "Enter an amount above 0";
  if (payment.amount > MAX_MINOR_UNITS) return "Amount is too large";
  if (terms.closedKind) return "This loan is already closed";

  const day = toUtcMidnight(payment.date);
  if (Number.isNaN(day.getTime())) return "Choose the date it was paid";
  if (dayIndex(day) < dayIndex(terms.startDate)) return "A payment cannot be dated before the loan started";
  if (dayIndex(day) > latestAllowedDay(now)) return "A payment cannot be dated in the future";

  const owedThen = computeLoan(terms, existing.filter((p) => dayIndex(p.date) <= dayIndex(day)), day).outstanding;
  if (payment.amount > owedThen) return `That is more than the ${formatMoney(owedThen, currency)} owed on that date`;

  // Back-dating must not leave a later payment larger than what was then owed.
  const before = computeLoan(terms, existing, now).overpaid;
  const after = computeLoan(terms, [...existing, { ...payment, transactionId: PREVIEW_KEY }], now).overpaid;
  if (after > before) return "That does not fit with the payments made after that date";
  return null;
}
