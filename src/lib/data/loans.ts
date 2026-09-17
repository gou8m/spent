import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Loans of the given direction that still have money outstanding — feeds the
 * "which loan does this repay" picker on the transaction form (LENT loans for an
 * Income repayment received, BORROWED loans for an Expense repayment made).
 * Outstanding is computed on read (never stored): the origin transaction's amount
 * minus every linked repayment's amount, same "compute, don't store" approach the
 * rest of the app already uses for notifications and balances.
 */
export const getOpenLoans = cache(async (userId: string, direction: "LENT" | "BORROWED") => {
  const loans = await prisma.loan.findMany({
    where: { userId, direction },
    include: { transaction: true, repayments: true },
    orderBy: { dueDate: "asc" },
  });

  return loans
    .map((loan) => ({
      id: loan.id,
      title: loan.transaction.title,
      dueDate: loan.dueDate,
      currency: loan.transaction.currency,
      originalAmount: loan.transaction.amount,
      outstanding: loan.transaction.amount - loan.repayments.reduce((sum, r) => sum + r.amount, 0),
    }))
    .filter((loan) => loan.outstanding > 0);
});
