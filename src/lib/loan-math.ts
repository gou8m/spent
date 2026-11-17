import { differenceInCalendarDays, startOfDay } from "date-fns";

/**
 * Loan arithmetic, shared by the server (what is still owed, validation) and the transaction form
 * (live "what does this payment cover" preview), so both always agree.
 *
 * Interest is simple interest on the unpaid principal, worked out day by day:
 *   per month: principal x rate% x days / 30      per year: principal x rate% x days / 365
 * Each payment is applied to the interest built up so far first, then to the principal. Interest
 * keeps growing on whatever principal is left until it is paid, until interest is stopped, or until
 * the remainder is waived or carried into a new loan. All amounts are integer minor units.
 */

export type InterestPeriod = "MONTH" | "YEAR";
export type LoanClosedKind = "WAIVED" | "ROLLED_OVER";

export interface LoanTerms {
  principal: number;
  startDate: Date;
  /** Percent; null / 0 means interest-free. */
  interestRate: number | null;
  interestPeriod: InterestPeriod | null;
  /** Interest stops growing from this date. */
  interestStoppedAt: Date | null;
  closedKind: LoanClosedKind | null;
  closedAt: Date | null;
}

export interface LoanPaymentInput {
  date: Date;
  amount: number;
  /** Which repayment transaction it came from (lets the form leave out the one being edited). */
  transactionId?: string;
}

export type LoanEvent =
  | { kind: "GIVEN"; date: Date; amount: number }
  | { kind: "PAYMENT"; date: Date; amount: number; toInterest: number; toPrincipal: number; transactionId?: string }
  | { kind: "INTEREST_STOPPED"; date: Date }
  | { kind: "WAIVED" | "ROLLED_OVER"; date: Date; amount: number };

export interface LoanState {
  hasInterest: boolean;
  /** Interest built up so far (paid or not). */
  interestAccrued: number;
  interestPaid: number;
  interestOutstanding: number;
  principalPaid: number;
  principalOutstanding: number;
  /** Everything paid in so far. */
  paidTotal: number;
  /** What is still owed right now (principal + interest), 0 once settled, waived or carried over. */
  outstanding: number;
  /** Amount written off (WAIVED) or moved into a new loan (ROLLED_OVER). */
  closedAmount: number;
  /** Payments beyond what was owed at the time (should not happen; the server prevents it). */
  overpaid: number;
  status: "OPEN" | "SETTLED" | "WAIVED" | "ROLLED_OVER";
  /** Interest per day on the current principal, for "adds about X a day" hints. */
  interestPerDay: number;
  events: LoanEvent[];
}

const DAYS_PER_PERIOD: Record<InterestPeriod, number> = { MONTH: 30, YEAR: 365 };

function interestFor(principal: number, rate: number, period: InterestPeriod, days: number): number {
  if (principal <= 0 || rate <= 0 || days <= 0) return 0;
  return Math.round(((principal * rate) / 100) * (days / DAYS_PER_PERIOD[period]));
}

export function computeLoan(terms: LoanTerms, payments: LoanPaymentInput[], asOf: Date = new Date()): LoanState {
  const rate = terms.interestRate && terms.interestRate > 0 && terms.interestPeriod ? terms.interestRate : 0;
  const period = terms.interestPeriod ?? "YEAR";
  const start = startOfDay(terms.startDate);
  // Interest never runs past the day it was stopped or the loan was closed out.
  const stopDates = [terms.interestStoppedAt, terms.closedAt].filter((d): d is Date => !!d).map((d) => startOfDay(d));
  const cutoff = stopDates.length ? new Date(Math.min(...stopDates.map((d) => d.getTime()))) : null;
  const clamp = (d: Date) => (cutoff && d.getTime() > cutoff.getTime() ? cutoff : d);

  const events: LoanEvent[] = [{ kind: "GIVEN", date: terms.startDate, amount: terms.principal }];
  let principal = terms.principal;
  let interestAccrued = 0;
  let interestPaid = 0;
  let principalPaid = 0;
  let paidTotal = 0;
  let overpaid = 0;
  let cursor = start;

  const accrueTo = (date: Date) => {
    const to = clamp(startOfDay(date));
    if (to.getTime() > cursor.getTime()) {
      interestAccrued += interestFor(principal, rate, period, differenceInCalendarDays(to, cursor));
      cursor = to;
    }
  };

  const sorted = [...payments].sort((a, b) => a.date.getTime() - b.date.getTime());
  for (const p of sorted) {
    accrueTo(p.date);
    const interestDue = Math.max(0, interestAccrued - interestPaid);
    const toInterest = Math.min(p.amount, interestDue);
    const toPrincipal = Math.min(p.amount - toInterest, principal);
    overpaid += p.amount - toInterest - toPrincipal;
    interestPaid += toInterest;
    principalPaid += toPrincipal;
    principal -= toPrincipal;
    paidTotal += p.amount;
    events.push({ kind: "PAYMENT", date: p.date, amount: p.amount, toInterest, toPrincipal, transactionId: p.transactionId });
  }

  accrueTo(asOf);

  if (terms.interestStoppedAt) events.push({ kind: "INTEREST_STOPPED", date: terms.interestStoppedAt });

  let interestOutstanding = Math.max(0, interestAccrued - interestPaid);
  let principalOutstanding = principal;
  let closedAmount = 0;
  let status: LoanState["status"] = "OPEN";

  if (terms.closedKind) {
    closedAmount = principalOutstanding + interestOutstanding;
    status = terms.closedKind;
    events.push({ kind: terms.closedKind, date: terms.closedAt ?? asOf, amount: closedAmount });
    principalOutstanding = 0;
    interestOutstanding = 0;
  } else if (principalOutstanding + interestOutstanding === 0) {
    status = "SETTLED";
  }

  const stopped = !!cutoff && cutoff.getTime() <= startOfDay(asOf).getTime();
  return {
    hasInterest: rate > 0,
    interestAccrued,
    interestPaid,
    interestOutstanding,
    principalPaid,
    principalOutstanding,
    paidTotal,
    outstanding: principalOutstanding + interestOutstanding,
    closedAmount,
    overpaid,
    status,
    interestPerDay: rate > 0 && !stopped && status === "OPEN" ? interestFor(principalOutstanding, rate, period, 1) : 0,
    events,
  };
}

/** "2% per month" / "12% per year". */
export function describeInterest(rate: number | null, period: InterestPeriod | null): string | null {
  if (!rate || rate <= 0 || !period) return null;
  return `${Number(rate.toFixed(3))}% per ${period === "MONTH" ? "month" : "year"}`;
}

/**
 * Splits a repayment across the loans it was said to pay, oldest first: each loan takes what it
 * owes on the payment date until the money runs out. `leftover` is money no selected loan could take.
 */
export function allocateRepayment(
  amount: number,
  loans: { id: string; outstandingAt: number }[],
): { allocations: { loanId: string; amount: number; clears: boolean }[]; leftover: number } {
  let remaining = amount;
  const allocations: { loanId: string; amount: number; clears: boolean }[] = [];
  for (const loan of loans) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, loan.outstandingAt);
    if (take <= 0) continue;
    allocations.push({ loanId: loan.id, amount: take, clears: take === loan.outstandingAt });
    remaining -= take;
  }
  return { allocations, leftover: remaining };
}
