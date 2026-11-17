"use server";

import { revalidatePath } from "next/cache";
import { addDays, startOfDay } from "date-fns";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { getLoansForRepayment } from "@/lib/data/loans";
import { computeLoan } from "@/lib/loan-math";

export interface LoanActionResult {
  error?: string;
}

function revalidateLoans() {
  revalidatePath("/loans");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

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
          dueDate: loan.dueDate.getTime() > today.getTime() ? loan.dueDate : addDays(today, 30),
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
  dueDate: z.coerce.date(),
  interestRate: z.number().positive("Enter an interest rate above 0").max(1000, "That rate looks too high").nullable(),
  interestPeriod: z.enum(["MONTH", "YEAR"]).nullable(),
});

/** Changes the due date and interest terms of a loan (interest is recalculated from the loan's start date). */
export async function updateLoanTermsAction(input: z.input<typeof termsSchema>): Promise<LoanActionResult> {
  const userId = await requireUserId();
  const parsed = termsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details" };
  const { loanId, dueDate, interestRate, interestPeriod } = parsed.data;
  if (interestRate && !interestPeriod) return { error: "Choose per month or per year" };

  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId }, select: { id: true } });
  if (!loan) return { error: "Loan not found" };

  await prisma.loan.update({
    where: { id: loanId },
    data: interestRate ? { dueDate, interestRate, interestPeriod } : { dueDate, interestRate: null, interestPeriod: null, interestStoppedAt: null },
  });
  revalidateLoans();
  return {};
}
