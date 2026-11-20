"use server";

import { goalCredit, goalAdjustment, goalDeltas } from "@/lib/goal-sync";
import { suggestCategoryName } from "@/lib/category-keywords";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { transactionSchema, type TransactionInput } from "@/lib/validations/transaction";
import { toMinorUnits, formatMoney } from "@/lib/money";
import { getTransactionById, getTransactions, TRANSACTIONS_PAGE_SIZE, type TransactionFilters } from "@/lib/data/transactions";
import { getAvailableBalanceForDebit } from "@/lib/balances";
import { allocateRepayment, computeLoan } from "@/lib/loan-math";
import { getLoansForRepayment } from "@/lib/data/loans";
import { addDays, startOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";

/**
 * A credit card's balance represents debt, not held money — carrying it further
 * negative (up to the limit) is the normal, expected way one gets used. Every other
 * account type represents money the user actually has, so an EXPENSE or TRANSFER
 * debiting one of those can't be allowed to push it below zero.
 */
async function checkSufficientBalance(
  userId: string,
  account: { id: string; name: string; type: string },
  amountMinor: number,
  currency: string,
): Promise<string | null> {
  if (account.type === "CREDIT_CARD") return null;

  const available = await getAvailableBalanceForDebit(userId, account.id);
  if (amountMinor > available) {
    return `Insufficient balance in "${account.name}" — available ${formatMoney(available, currency)}.`;
  }
  return null;
}

export interface ActionResult {
  error?: string;
}

interface RepaymentPlan {
  allocations: { loanId: string; amount: number }[];
  /** Operations that close out what is left of a part-paid loan, per the chosen settlement. */
  settlementOps: Prisma.PrismaPromise<unknown>[];
  error?: string;
}

/**
 * Splits a repayment across the loans it was said to pay (oldest loan first, each taking what it owes
 * on the payment date, interest before principal) and checks everything: the loans are the user's, the
 * direction matches (an Expense repays money you borrowed, an Income money you lent), the currency
 * matches, and the amount does not exceed what is owed. `excludeTransactionId` leaves out the
 * repayment being edited so it is not counted against itself.
 */
async function planLoanRepayment(
  userId: string,
  data: TransactionInput,
  amountMinor: number,
  excludeTransactionId?: string,
): Promise<RepaymentPlan> {
  const none: RepaymentPlan = { allocations: [], settlementOps: [] };
  const ids = [...new Set(data.repaysLoanIds ?? [])];
  if (ids.length === 0) return none;

  const expectedDirection = data.type === "EXPENSE" ? "BORROWED" : data.type === "INCOME" ? "LENT" : null;
  const loans = await getLoansForRepayment(userId, ids, excludeTransactionId);
  if (loans.length !== ids.length) return { ...none, error: "Loan not found" };
  const payDate = startOfDay(data.date);

  for (const loan of loans) {
    if (loan.direction !== expectedDirection) return { ...none, error: "That loan can't be repaid by this kind of transaction" };
    if (loan.currency !== data.currency) return { ...none, error: `"${loan.title}" is in ${loan.currency}; use an account in the same currency` };
    if (payDate.getTime() < startOfDay(loan.startDate).getTime()) return { ...none, error: `"${loan.title}" was made after this payment date` };
    if (loan.state.status === "WAIVED" || loan.state.status === "ROLLED_OVER") return { ...none, error: `"${loan.title}" is already closed` };
  }

  const ordered = [...loans].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const owed = ordered.map((loan) => ({
    id: loan.id,
    // What was owed on the payment date: only payments made up to then count.
    outstandingAt: computeLoan(loan.terms, loan.payments.filter((p) => startOfDay(p.date).getTime() <= payDate.getTime()), payDate).outstanding,
  }));
  const { allocations, leftover } = allocateRepayment(amountMinor, owed);
  if (leftover > 0) {
    return { ...none, error: `That is ${formatMoney(leftover, data.currency)} more than is owed on the selected loans.` };
  }

  const settlementOps: Prisma.PrismaPromise<unknown>[] = [];
  const mode = data.settlement ?? "KEEP";
  for (const alloc of allocations) {
    if (alloc.clears || mode === "KEEP") continue;
    const loan = ordered.find((l) => l.id === alloc.loanId)!;
    const residual = owed.find((o) => o.id === alloc.loanId)!.outstandingAt - alloc.amount;
    if (mode === "STOP_INTEREST") {
      settlementOps.push(prisma.loan.update({ where: { id: loan.id }, data: { interestStoppedAt: payDate } }));
    } else if (mode === "WAIVE") {
      settlementOps.push(prisma.loan.update({ where: { id: loan.id }, data: { closedKind: "WAIVED", closedAt: payDate, closedAmount: residual } }));
    } else if (mode === "NEW_LOAN") {
      settlementOps.push(
        prisma.loan.update({ where: { id: loan.id }, data: { closedKind: "ROLLED_OVER", closedAt: payDate, closedAmount: residual } }),
        prisma.loan.create({
          data: {
            userId,
            direction: loan.direction,
            counterpartyType: loan.counterpartyType,
            dueDate: loan.dueDate ? (loan.dueDate.getTime() > payDate.getTime() ? loan.dueDate : addDays(payDate, 30)) : null,
            principal: residual,
            title: `${loan.title.replace(/ \(carried over\)$/, "")} (carried over)`,
            currency: loan.currency,
            startDate: payDate,
            rolledFromLoanId: loan.id,
          },
        }),
      );
    }
  }
  return { allocations: allocations.map((a) => ({ loanId: a.loanId, amount: a.amount })), settlementOps };
}

/** The interest columns for a loan row: a rate only counts when it is above zero. */
function loanInterestFields(loan: { interestRate?: number; interestPeriod?: "MONTH" | "YEAR" }) {
  return loan.interestRate && loan.interestRate > 0
    ? { interestRate: loan.interestRate, interestPeriod: loan.interestPeriod ?? "YEAR" }
    : { interestRate: null, interestPeriod: null };
}

export async function getTransactionAction(id: string) {
  const userId = await requireUserId();
  const tx = await getTransactionById(userId, id);
  if (!tx) return tx;
  // For editing a repayment: the loans it paid, worked out without this payment, so the form can
  // show what was owed before it (those loans may be fully settled now, so are not in the open list).
  const paidIds = tx.loanPayments.map((p) => p.loanId);
  const paidLoans = paidIds.length ? await getLoansForRepayment(userId, paidIds, tx.id) : [];
  return { ...tx, paidLoans };
}

/**
 * Payee memory — the transaction form calls this once the title field loses focus,
 * and pre-fills the category if the user hasn't already picked one. Live-queried
 * against transaction history, not a stored mapping (same "compute, don't store"
 * philosophy as everything else in this app that pattern-matches past data).
 */
export async function lookupPayeeCategoryAction(title: string, type: "EXPENSE" | "INCOME"): Promise<{ categoryId: string | null }> {
  const userId = await requireUserId();
  const trimmed = title.trim();
  if (!trimmed) return { categoryId: null };

  // Only categories the user can still pick (not archived).
  const usable = (id: string | null | undefined) =>
    id ? prisma.category.findFirst({ where: { id, userId, type, isArchived: false }, select: { id: true } }).then((c) => c?.id ?? null) : Promise.resolve(null);

  // 1. The same title as a past transaction: its most recent category.
  const exact = await prisma.transaction.findFirst({
    where: { userId, type, title: { equals: trimmed, mode: "insensitive" }, categoryId: { not: null } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: { categoryId: true },
  });
  const fromExact = await usable(exact?.categoryId);
  if (fromExact) return { categoryId: fromExact };

  // 2. A similar title ("Swiggy order" after "Swiggy"): the most used category among past
  //    transactions that start with the same first word.
  const firstWord = trimmed.split(/\s+/)[0];
  if (firstWord.length >= 3) {
    const similar = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type, title: { startsWith: firstWord, mode: "insensitive" }, categoryId: { not: null } },
      _count: true,
      orderBy: { _count: { categoryId: "desc" } },
      take: 1,
    });
    const fromSimilar = await usable(similar[0]?.categoryId);
    if (fromSimilar) return { categoryId: fromSimilar };
  }

  // 3. Built-in keyword hints (uber -> Transport, netflix -> Subscriptions ...), resolved to
  //    whichever category the user has under that name.
  const hinted = suggestCategoryName(trimmed, type);
  if (hinted) {
    const byName = await prisma.category.findFirst({
      where: { userId, type, isArchived: false, name: { equals: hinted, mode: "insensitive" } },
      select: { id: true },
    });
    if (byName) return { categoryId: byName.id };
  }

  return { categoryId: null };
}

/**
 * Fetches exactly one page of the transactions list. The page itself only ever
 * loads page 1 server-side; every subsequent "Load more" click calls this
 * instead of re-navigating — avoids re-fetching (and re-sending over the wire)
 * every already-loaded row just to append one more page's worth.
 */
export async function loadMoreTransactionsAction(filters: TransactionFilters, page: number) {
  const userId = await requireUserId();
  return getTransactions(userId, { ...filters, page, pageSize: TRANSACTIONS_PAGE_SIZE });
}

/** Just the match count for a candidate filter combination — feeds the filter
 * sheet's live "Show N results" button without loading any transaction rows. */
export async function countFilteredTransactionsAction(filters: TransactionFilters) {
  const userId = await requireUserId();
  const result = await getTransactions(userId, { ...filters, page: 1, pageSize: 1 });
  return result.total;
}

function revalidateAfterTransactionChange() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/budgets");
  revalidatePath("/people");
}

/** The goal an incoming transaction is meant for must be one of the user's own, still open (or already
 * the one this transaction is linked to), and saved in exactly the account the money lands in. */
async function validateGoalLink(
  userId: string,
  goalId: string | undefined,
  creditedAccountId: string | null,
  alreadyLinkedGoalId?: string | null,
): Promise<string | null> {
  if (!goalId) return null;
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return "Goal not found";
  if (goal.status === "ARCHIVED") return "That goal is archived";
  if (goal.status !== "ACTIVE" && goal.id !== alreadyLinkedGoalId) return "That goal is already complete";
  if (!goal.accountId || goal.accountId !== creditedAccountId) return "That goal is saved in a different account";
  return null;
}

export async function createTransactionAction(input: TransactionInput): Promise<ActionResult & { id?: string }> {
  const userId = await requireUserId();
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };
  const data = parsed.data;
  // Loans, repayments and goal money are applied straight away; anything else follows the status the form chose
  // (pending while its date is still ahead, completed from its day on).
  const status = data.goalId || data.loan || (data.repaysLoanIds && data.repaysLoanIds.length > 0) ? "COMPLETED" : data.status;

  const account = await prisma.account.findFirst({ where: { id: data.accountId, userId } });
  if (!account) return { error: "Account not found" };

  let destination: { currency: string } | null = null;
  if (data.type === "TRANSFER") {
    destination = await prisma.account.findFirst({ where: { id: data.transferToAccountId, userId }, select: { currency: true } });
    if (!destination) return { error: "Destination account not found" };
  } else {
    const category = await prisma.category.findFirst({ where: { id: data.categoryId, userId } });
    if (!category) return { error: "Category not found" };
  }

  const amountMinor = toMinorUnits(data.amount, data.currency);
  const repayment = await planLoanRepayment(userId, data, amountMinor);
  if (repayment.error) return { error: repayment.error };
  const isCrossCurrency = destination && destination.currency !== data.currency;
  const transferToAmountMinor =
    isCrossCurrency && data.transferToAmount ? toMinorUnits(data.transferToAmount, destination!.currency) : null;

  if (status === "COMPLETED" && (data.type === "EXPENSE" || data.type === "TRANSFER")) {
    const balanceError = await checkSufficientBalance(userId, account, amountMinor, data.currency);
    if (balanceError) return { error: balanceError };
  }

  const creditedAccountId = data.type === "TRANSFER" ? (data.transferToAccountId ?? null) : data.type === "INCOME" ? data.accountId : null;
  const goalError = await validateGoalLink(userId, data.goalId, creditedAccountId);
  if (goalError) return { error: goalError };
  const credit = goalCredit({ type: data.type, amount: amountMinor, transferToAmount: transferToAmountMinor });
  // An upcoming transaction has not moved any money yet, so it does not count toward the goal.
  const goalOps = data.goalId && status === "COMPLETED" ? await goalAdjustment(data.goalId, credit) : [];

  const [created] = await prisma.$transaction([
    prisma.transaction.create({
    data: {
      userId,
      goalId: data.goalId ?? null,
      accountId: data.accountId,
      transferToAccountId: data.type === "TRANSFER" ? data.transferToAccountId : null,
      transferToAmount: transferToAmountMinor,
      categoryId: data.type === "TRANSFER" ? null : data.categoryId,
      type: data.type,
      amount: amountMinor,
      currency: data.currency,
      title: data.title,
      note: data.note || null,
      date: data.date,
      status: status,
      tags: {
        create: data.tagIds.map((tagId) => ({ tagId })),
      },
      loanPayments: { create: repayment.allocations },
      loan: data.loan
        ? {
            create: {
              userId,
              direction: data.loan.direction,
              counterpartyType: data.loan.counterpartyType,
              dueDate: data.loan.dueDate,
              ...loanInterestFields(data.loan),
            },
          }
        : undefined,
    },
    }),
    ...repayment.settlementOps,
    ...goalOps,
  ]);

  revalidateAfterTransactionChange();
  revalidatePath("/goals");
  return { id: created.id };
}

export async function updateTransactionAction(id: string, input: TransactionInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };
  const data = parsed.data;
  // Loans, repayments and goal money are applied straight away; anything else follows the status the form chose
  // (pending while its date is still ahead, completed from its day on).
  const status = data.goalId || data.loan || (data.repaysLoanIds && data.repaysLoanIds.length > 0) ? "COMPLETED" : data.status;

  const existing = await prisma.transaction.findFirst({ where: { id, userId }, include: { loan: true } });
  if (!existing) return { error: "Transaction not found" };
  if (existing.extraOut > 0 || (await prisma.splitExpense.findFirst({ where: { transactionId: id }, select: { id: true } }))) {
    return { error: "This is part of a shared expense. Change it from its group." };
  }

  const account = await prisma.account.findFirst({ where: { id: data.accountId, userId } });
  if (!account) return { error: "Account not found" };

  let destination: { currency: string } | null = null;
  if (data.type === "TRANSFER") {
    destination = await prisma.account.findFirst({ where: { id: data.transferToAccountId, userId }, select: { currency: true } });
    if (!destination) return { error: "Destination account not found" };
  } else {
    const category = await prisma.category.findFirst({ where: { id: data.categoryId, userId } });
    if (!category) return { error: "Category not found" };
  }

  const amountMinor = toMinorUnits(data.amount, data.currency);
  const repayment = await planLoanRepayment(userId, data, amountMinor, id);
  if (repayment.error) return { error: repayment.error };
  const isCrossCurrency = destination && destination.currency !== data.currency;
  const transferToAmountMinor =
    isCrossCurrency && data.transferToAmount ? toMinorUnits(data.transferToAmount, destination!.currency) : null;

  // No sufficient-balance check when editing: a past entry may legitimately be changed even if the
  // account would dip below zero at that point in time; balances are always computed from the whole
  // history, so everything after it adjusts by itself.

  // A legacy "Contribution to <goal>" expense keeps its goal; otherwise the goal comes from the form
  // and must be one saved in the account this money lands in.
  const keepsLegacyGoal = !!existing.goalId && existing.type === "EXPENSE" && data.type === "EXPENSE";
  const goalId = keepsLegacyGoal ? existing.goalId! : data.goalId;
  if (!keepsLegacyGoal) {
    const creditedAccountId = data.type === "TRANSFER" ? (data.transferToAccountId ?? null) : data.type === "INCOME" ? data.accountId : null;
    const goalError = await validateGoalLink(userId, goalId, creditedAccountId, existing.goalId);
    if (goalError) return { error: goalError };
  }
  // Take back what the old version credited to its goal and add what the new version credits (only
  // completed transactions have moved money, so upcoming ones never count).
  const before = existing.goalId && existing.status === "COMPLETED" ? { goalId: existing.goalId, credit: goalCredit(existing) } : null;
  const after =
    goalId && status === "COMPLETED"
      ? { goalId, credit: goalCredit({ type: data.type, amount: amountMinor, transferToAmount: transferToAmountMinor }) }
      : null;
  const goalOps = (await Promise.all([...goalDeltas(before, after)].map(([gid, delta]) => goalAdjustment(gid, delta)))).flat();

  await prisma.$transaction([
    prisma.transactionTag.deleteMany({ where: { transactionId: id } }),
    prisma.loanPayment.deleteMany({ where: { transactionId: id } }),
    ...repayment.settlementOps,
    ...goalOps,
    prisma.transaction.update({
      where: { id },
      data: {
        goalId: goalId ?? null,
        accountId: data.accountId,
        transferToAccountId: data.type === "TRANSFER" ? data.transferToAccountId : null,
        transferToAmount: transferToAmountMinor,
        categoryId: data.type === "TRANSFER" ? null : data.categoryId,
        type: data.type,
        amount: amountMinor,
        currency: data.currency,
        title: data.title,
        note: data.note || null,
        date: data.date,
        status: status,
        repaysLoanId: null,
        tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
        loanPayments: { create: repayment.allocations },
        // Present + no existing row → create it. Present + existing row → update it
        // (e.g. the due date changed). Absent + existing row → delete it — this is
        // the "settle by editing" path: unchecking the loan toggle in the form drops
        // the reminder. Absent + no existing row → omit the key entirely (no-op).
        loan: data.loan
          ? {
              upsert: {
                create: { userId, direction: data.loan.direction, counterpartyType: data.loan.counterpartyType, dueDate: data.loan.dueDate, ...loanInterestFields(data.loan) },
                update: { direction: data.loan.direction, counterpartyType: data.loan.counterpartyType, dueDate: data.loan.dueDate, ...loanInterestFields(data.loan) },
              },
            }
          : existing.loan
            ? { delete: true }
            : undefined,
      },
    }),
  ]);

  revalidateAfterTransactionChange();
  revalidatePath("/goals");
  return {};
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return { error: "Transaction not found" };
  if (await prisma.splitExpense.findFirst({ where: { transactionId: id, deletedAt: null }, select: { id: true } })) {
    return { error: "This is part of a shared expense. Delete it from its group." };
  }

  // Deleting a transaction that was set aside for a goal takes that money back out of the goal.
  const goalOps =
    existing.goalId && existing.status === "COMPLETED" ? await goalAdjustment(existing.goalId, -goalCredit(existing)) : [];
  await prisma.$transaction([prisma.transaction.delete({ where: { id } }), ...goalOps]);
  revalidateAfterTransactionChange();
  revalidatePath("/goals");
  return {};
}

/** Finds-or-creates a tag by name for the current user — the transaction form's
 * "Add tag" chip calls this so a freshly typed tag name resolves to a real id it
 * can submit, same one reused next time the same name is typed. */
export async function upsertTagAction(name: string) {
  const userId = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Tag name is required" };

  const tag = await prisma.tag.upsert({
    where: { userId_name: { userId, name: trimmed } },
    update: {},
    create: { userId, name: trimmed },
  });
  return { tag };
}
