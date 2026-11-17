import { cache } from "react";
import { prisma } from "@/lib/db";
import { computeLoan, type InterestPeriod, type LoanClosedKind, type LoanPaymentInput, type LoanState, type LoanTerms } from "@/lib/loan-math";

const loanInclude = {
  transaction: { select: { id: true, title: true, amount: true, currency: true, date: true, status: true, accountId: true, note: true } },
  payments: { include: { transaction: { select: { id: true, date: true, status: true, title: true, accountId: true } } } },
  rolledFrom: { select: { id: true, title: true, transaction: { select: { title: true } } } },
  rolledInto: { select: { id: true } },
} as const;

type LoanRow = NonNullable<Awaited<ReturnType<typeof findLoanRows>>>[number];

function findLoanRows(userId: string, where: object = {}) {
  return prisma.loan.findMany({ where: { userId, ...where }, include: loanInclude, orderBy: { dueDate: "asc" } });
}

/** What a loan is, whether or not it came from a transaction. */
export function loanBasics(loan: LoanRow) {
  return {
    title: loan.transaction?.title ?? loan.title ?? "Loan",
    principal: loan.transaction?.amount ?? loan.principal ?? 0,
    currency: loan.transaction?.currency ?? loan.currency ?? "USD",
    startDate: loan.transaction?.date ?? loan.startDate ?? loan.createdAt,
  };
}

function termsOf(loan: LoanRow): LoanTerms {
  const b = loanBasics(loan);
  return {
    principal: b.principal,
    startDate: b.startDate,
    interestRate: loan.interestRate,
    interestPeriod: (loan.interestPeriod as InterestPeriod | null) ?? null,
    interestStoppedAt: loan.interestStoppedAt,
    closedKind: (loan.closedKind as LoanClosedKind | null) ?? null,
    closedAt: loan.closedAt,
  };
}

/** Only payments that have really happened count; an upcoming repayment has not moved money yet. */
function paymentsOf(loan: LoanRow, excludeTransactionId?: string): LoanPaymentInput[] {
  return loan.payments
    .filter((p) => p.transaction.status === "COMPLETED" && p.transactionId !== excludeTransactionId)
    .map((p) => ({ date: p.transaction.date, amount: p.amount, transactionId: p.transactionId }));
}

export interface LoanSummary {
  id: string;
  direction: "LENT" | "BORROWED";
  counterpartyType: string | null;
  title: string;
  currency: string;
  originalAmount: number;
  startDate: Date;
  dueDate: Date;
  originTransactionId: string | null;
  originAccountId: string | null;
  interestRate: number | null;
  interestPeriod: InterestPeriod | null;
  interestStoppedAt: Date | null;
  closedKind: LoanClosedKind | null;
  closedAt: Date | null;
  rolledFrom: { id: string; title: string } | null;
  rolledIntoId: string | null;
  state: LoanState;
  /** Everything the form needs to recompute the balance for another date. */
  terms: LoanTerms;
  payments: LoanPaymentInput[];
  /** Each repayment with the transaction's title, for the history view. */
  paymentDetails: { transactionId: string; title: string; date: Date; amount: number; accountId: string; status: string }[];
}

function summarize(loan: LoanRow, excludeTransactionId?: string): LoanSummary {
  const b = loanBasics(loan);
  const terms = termsOf(loan);
  const payments = paymentsOf(loan, excludeTransactionId);
  return {
    id: loan.id,
    direction: loan.direction as "LENT" | "BORROWED",
    counterpartyType: loan.counterpartyType,
    title: b.title,
    currency: b.currency,
    originalAmount: b.principal,
    startDate: b.startDate,
    dueDate: loan.dueDate,
    originTransactionId: loan.transaction?.id ?? null,
    originAccountId: loan.transaction?.accountId ?? null,
    interestRate: loan.interestRate,
    interestPeriod: terms.interestPeriod,
    interestStoppedAt: loan.interestStoppedAt,
    closedKind: terms.closedKind,
    closedAt: loan.closedAt,
    rolledFrom: loan.rolledFrom ? { id: loan.rolledFrom.id, title: loan.rolledFrom.transaction?.title ?? loan.rolledFrom.title ?? "Loan" } : null,
    rolledIntoId: loan.rolledInto[0]?.id ?? null,
    state: computeLoan(terms, payments),
    terms,
    payments,
    paymentDetails: loan.payments
      .filter((p) => p.transactionId !== excludeTransactionId)
      .map((p) => ({ transactionId: p.transactionId, title: p.transaction.title, date: p.transaction.date, amount: p.amount, accountId: p.transaction.accountId, status: p.transaction.status }))
      .sort((a, c) => a.date.getTime() - c.date.getTime()),
  };
}

/** Every loan the user has (lent and borrowed, open and closed) with its balance worked out. */
export const getLoans = cache(async (userId: string): Promise<LoanSummary[]> => {
  const rows = await findLoanRows(userId);
  return rows.map((r) => summarize(r));
});

/**
 * Loans of the given direction that still have money outstanding — feeds the "which loans does this
 * repay" picker on the transaction form (LENT loans for an Income repayment received, BORROWED loans
 * for an Expense repayment made). `excludeTransactionId` leaves one repayment out of the maths, so
 * editing a repayment still lists the loans it paid and shows what was owed before it.
 */
export async function getOpenLoans(userId: string, direction: "LENT" | "BORROWED", excludeTransactionId?: string) {
  const rows = await findLoanRows(userId, { direction });
  return rows
    .map((r) => summarize(r, excludeTransactionId))
    .filter((l) => l.state.status === "OPEN" && l.state.outstanding > 0)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

export type OpenLoan = Awaited<ReturnType<typeof getOpenLoans>>[number];

/** The loans a repayment transaction paid, for the form when editing it. */
export const getLoanPaymentsForTransaction = cache(async (userId: string, transactionId: string) => {
  const rows = await prisma.loanPayment.findMany({ where: { transactionId, loan: { userId } }, select: { loanId: true, amount: true } });
  return rows;
});

/** The given loans (must belong to the user), with one repayment transaction left out of the maths.
 * Used to split a payment across loans and to check that it fits. */
export async function getLoansForRepayment(userId: string, ids: string[], excludeTransactionId?: string) {
  const rows = await findLoanRows(userId, { id: { in: ids } });
  return rows.map((r) => summarize(r, excludeTransactionId));
}
