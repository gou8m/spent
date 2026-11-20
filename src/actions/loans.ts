"use server";

import { revalidatePath } from "next/cache";
import { addDays, startOfDay } from "date-fns";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { getLoansForRepayment } from "@/lib/data/loans";
import { computeLoan } from "@/lib/loan-math";
import { checkOutsidePayment, dayIndex, latestAllowedDay, toUtcMidnight } from "@/lib/loan-payment";
import { CURRENCIES } from "@/lib/constants";
import { MAX_MINOR_UNITS, toMinorUnits } from "@/lib/money";

export interface LoanActionResult {
  error?: string;
}

function revalidateLoans() {
  revalidatePath("/loans");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/people");
  revalidatePath("/dashboard");
}

const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as [string, ...string[]];
const FIFTY_YEARS_MS = 50 * 365 * 24 * 60 * 60 * 1000;

const settleSchema = z.object({
  loanId: z.string().min(1),
  /** WAIVE: write off what is left. NEW_LOAN: close this loan and open a new interest-free one for what is left.
   * STOP_INTEREST / RESUME_INTEREST: freeze or unfreeze the amount owed. REOPEN: undo a waive or carry-over. */
  mode: z.enum(["WAIVE", "NEW_LOAN", "STOP_INTEREST", "RESUME_INTEREST", "REOPEN"]),
});

/** Closes out, freezes or reopens a loan from the Loans page (the same choices the repayment form
 * offers for a part-paid loan, for loans where the balance was left open). */
export async function settleLoanAction(input: z.infer<typeof settleSchema>): Promise<LoanActionResult> {
  const userId = await requireUserId();
  const parsed = settleSchema.safeParse(input);
  if (!parsed.success) return { error: "Something went wrong" };
  const { loanId, mode } = parsed.data;

  const [loan] = await getLoansForRepayment(userId, [loanId]);
  if (!loan) return { error: "Loan not found" };
  const today = startOfDay(new Date());

  if (mode === "REOPEN") {
    if (!loan.closedKind) return { error: "This loan is not closed" };
    if (loan.closedKind === "ROLLED_OVER" && loan.rolledIntoId) {
      const next = await prisma.loan.findFirst({ where: { id: loan.rolledIntoId, userId }, include: { payments: true, rolledInto: true } });
      if (next && (next.payments.length > 0 || next.rolledInto.length > 0)) {
        return { error: "The new loan already has payments, so this one cannot be reopened" };
      }
      if (next) await prisma.loan.delete({ where: { id: next.id } });
    }
    await prisma.loan.update({ where: { id: loanId }, data: { closedKind: null, closedAt: null, closedAmount: null } });
    revalidateLoans();
    return {};
  }

  if (mode === "RESUME_INTEREST") {
    if (!loan.interestStoppedAt) return { error: "Interest is not stopped" };
    await prisma.loan.update({ where: { id: loanId }, data: { interestStoppedAt: null } });
    revalidateLoans();
    return {};
  }

  if (loan.state.status !== "OPEN") return { error: "This loan is already closed" };
  const owed = computeLoan(loan.terms, loan.payments, today).outstanding;

  if (mode === "STOP_INTEREST") {
    if (!loan.interestRate) return { error: "This loan has no interest" };
    await prisma.loan.update({ where: { id: loanId }, data: { interestStoppedAt: today } });
  } else if (mode === "WAIVE") {
    await prisma.loan.update({ where: { id: loanId }, data: { closedKind: "WAIVED", closedAt: today, closedAmount: owed } });
  } else {
    await prisma.$transaction([
      prisma.loan.update({ where: { id: loanId }, data: { closedKind: "ROLLED_OVER", closedAt: today, closedAmount: owed } }),
      prisma.loan.create({
        data: {
          userId,
          direction: loan.direction,
          counterpartyType: loan.counterpartyType,
          dueDate: loan.dueDate ? (loan.dueDate.getTime() > today.getTime() ? loan.dueDate : addDays(today, 30)) : null,
          principal: owed,
          title: `${loan.title.replace(/ \(carried over\)$/, "")} (carried over)`,
          currency: loan.currency,
          startDate: today,
          rolledFromLoanId: loanId,
        },
      }),
    ]);
  }
  revalidateLoans();
  return {};
}

const termsSchema = z.object({
  loanId: z.string().min(1),
  /** Only for a loan added by hand: who it is with, how much, and when it started. */
  title: z.string().trim().min(1, "Enter who it is with").max(120).optional(),
  amount: z.number().positive("Enter an amount above 0").max(MAX_MINOR_UNITS, "Amount is too large").optional(),
  startDate: z.coerce.date().optional(),
  /** Null: no repay-by date. */
  dueDate: z.coerce.date().nullable(),
  interestRate: z.number().positive("Enter an interest rate above 0").max(1000, "That rate looks too high").nullable(),
  interestPeriod: z.enum(["MONTH", "YEAR"]).nullable(),
});

/** Changes the due date and interest terms of a loan (interest is recalculated from the loan's start date). */
export async function updateLoanTermsAction(input: z.input<typeof termsSchema>): Promise<LoanActionResult> {
  const userId = await requireUserId();
  const parsed = termsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details" };
  const { loanId, dueDate, interestRate, interestPeriod, title, amount, startDate } = parsed.data;
  if (interestRate && !interestPeriod) return { error: "Choose per month or per year" };

  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId }, select: { id: true, standalone: true, currency: true } });
  if (!loan) return { error: "Loan not found" };

  const interestData = interestRate ? { dueDate, interestRate, interestPeriod } : { dueDate, interestRate: null, interestPeriod: null, interestStoppedAt: null };
  const ownData: { title?: string; principal?: number; startDate?: Date } = {};
  if (loan.standalone) {
    if (title) ownData.title = title;
    if (amount !== undefined) ownData.principal = toMinorUnits(amount, loan.currency ?? "USD");
    if (startDate) {
      const day = toUtcMidnight(startDate);
      if (dayIndex(day) > latestAllowedDay()) return { error: "The start date cannot be in the future" };
      if (Date.now() - day.getTime() > FIFTY_YEARS_MS) return { error: "That start date is too far back" };
      ownData.startDate = day;
    }
    if (ownData.principal !== undefined || ownData.startDate) {
      // Changing the amount or start date must not leave more paid than is owed.
      const [current] = await getLoansForRepayment(userId, [loanId]);
      const after = computeLoan(
        { ...current.terms, principal: ownData.principal ?? current.terms.principal, startDate: ownData.startDate ?? current.terms.startDate },
        current.payments,
      );
      if (after.overpaid > 0) return { error: "That would be less than has already been paid back" };
    }
  }

  await prisma.loan.update({ where: { id: loanId }, data: { ...interestData, ...ownData } });
  revalidateLoans();
  return {};
}

const standaloneSchema = z
  .object({
    direction: z.enum(["LENT", "BORROWED"]),
    title: z.string().trim().min(1, "Enter who it is with").max(120),
    amount: z.number().positive("Enter an amount above 0").max(MAX_MINOR_UNITS, "Amount is too large"),
    currency: z.enum(CURRENCY_CODES),
    startDate: z.coerce.date(),
    dueDate: z.coerce.date().nullable().optional(),
    counterpartyType: z.enum(["FRIEND", "FAMILY", "LENDER", "BANK", "OTHER"]).nullable().optional(),
    interestRate: z.number().positive("Enter an interest rate above 0").max(1000, "That rate looks too high").nullable().optional(),
    interestPeriod: z.enum(["MONTH", "YEAR"]).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const start = toUtcMidnight(data.startDate).getTime();
    if (Number.isNaN(start)) ctx.addIssue({ code: "custom", path: ["startDate"], message: "Choose the date it started" });
    else if (dayIndex(data.startDate) > latestAllowedDay()) ctx.addIssue({ code: "custom", path: ["startDate"], message: "The start date cannot be in the future" });
    else if (Date.now() - start > FIFTY_YEARS_MS) ctx.addIssue({ code: "custom", path: ["startDate"], message: "That start date is too far back" });
    if (data.dueDate && toUtcMidnight(data.dueDate).getTime() < start) ctx.addIssue({ code: "custom", path: ["dueDate"], message: "The due date cannot be before the start date" });
    if (data.interestRate && !data.interestPeriod) ctx.addIssue({ code: "custom", path: ["interestRate"], message: "Choose per month or per year" });
  });

/**
 * A loan taken or given outside Spent: no transaction behind it and no account balance changes. The loan keeps
 * its own amount, date and currency, and interest still counts day by day from the start date.
 */
export async function createStandaloneLoanAction(input: z.input<typeof standaloneSchema>): Promise<LoanActionResult & { id?: string }> {
  const userId = await requireUserId();
  const parsed = standaloneSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details" };
  const d = parsed.data;

  const loan = await prisma.loan.create({
    data: {
      userId,
      standalone: true,
      direction: d.direction,
      counterpartyType: d.direction === "BORROWED" ? (d.counterpartyType ?? null) : null,
      title: d.title,
      principal: toMinorUnits(d.amount, d.currency),
      currency: d.currency,
      startDate: toUtcMidnight(d.startDate),
      dueDate: d.dueDate ? toUtcMidnight(d.dueDate) : null,
      interestRate: d.interestRate ?? null,
      interestPeriod: d.interestRate ? (d.interestPeriod ?? null) : null,
    },
    select: { id: true },
  });
  revalidateLoans();
  return { id: loan.id };
}

const outsidePaymentSchema = z.object({
  loanId: z.string().min(1),
  amount: z.number().positive("Enter an amount above 0").max(MAX_MINOR_UNITS, "Amount is too large"),
  date: z.coerce.date(),
  note: z.string().trim().max(200).optional(),
});

/** A payment made outside Spent (cash, or someone else paid): reduces what is owed, creates no transaction. */
export async function recordLoanPaymentAction(input: z.input<typeof outsidePaymentSchema>): Promise<LoanActionResult> {
  const userId = await requireUserId();
  const parsed = outsidePaymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details" };
  const { loanId, amount, date, note } = parsed.data;

  const [loan] = await getLoansForRepayment(userId, [loanId]);
  if (!loan) return { error: "Loan not found" };
  const minor = toMinorUnits(amount, loan.currency);
  const problem = checkOutsidePayment(loan.terms, loan.payments, { date, amount: minor }, loan.currency);
  if (problem) return { error: problem };

  await prisma.loanPayment.create({ data: { loanId, amount: minor, paidOn: toUtcMidnight(date), note: note || null } });
  revalidateLoans();
  return {};
}

/** Removes a payment recorded outside Spent. A payment that came from a transaction is removed by deleting that transaction. */
export async function deleteLoanPaymentAction(paymentId: string): Promise<LoanActionResult> {
  const userId = await requireUserId();
  const payment = await prisma.loanPayment.findFirst({ where: { id: paymentId, loan: { userId } }, select: { id: true, transactionId: true } });
  if (!payment) return { error: "Payment not found" };
  if (payment.transactionId) return { error: "That payment came from a transaction. Delete the transaction instead" };

  await prisma.loanPayment.delete({ where: { id: payment.id } });
  revalidateLoans();
  return {};
}

/** Deletes a loan that was added by hand, with the payments recorded against it. Transactions are never touched. */
export async function deleteStandaloneLoanAction(loanId: string): Promise<LoanActionResult> {
  const userId = await requireUserId();
  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId }, select: { id: true, standalone: true } });
  if (!loan) return { error: "Loan not found" };
  if (!loan.standalone) return { error: "Only a loan added by hand can be deleted here" };

  await prisma.loan.delete({ where: { id: loan.id } });
  revalidateLoans();
  return {};
}
