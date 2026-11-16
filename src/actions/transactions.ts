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
  excludeTransaction?: { accountId: string; type: string; amount: number },
): Promise<string | null> {
  if (account.type === "CREDIT_CARD") return null;

  const available = await getAvailableBalanceForDebit(userId, account.id, excludeTransaction);
  if (amountMinor > available) {
    return `Insufficient balance in "${account.name}" — available ${formatMoney(available, currency)}.`;
  }
  return null;
}

export interface ActionResult {
  error?: string;
}

/** An Expense can only repay a BORROWED loan (money you owe); an Income can only
 * repay a LENT one (money owed to you) — same direction check the picker's own
 * `getOpenLoans` call already narrows by, re-verified here since this is a
 * server-trusted boundary. */
async function validateRepaysLoan(userId: string, repaysLoanId: string | undefined, type: string): Promise<string | null> {
  if (!repaysLoanId) return null;
  const loan = await prisma.loan.findFirst({ where: { id: repaysLoanId, userId } });
  if (!loan) return "Loan not found";
  const expectedDirection = type === "EXPENSE" ? "BORROWED" : type === "INCOME" ? "LENT" : null;
  if (loan.direction !== expectedDirection) return "That loan can't be repaid by this kind of transaction";
  return null;
}

export async function getTransactionAction(id: string) {
  const userId = await requireUserId();
  return getTransactionById(userId, id);
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

  const repayError = await validateRepaysLoan(userId, data.repaysLoanId, data.type);
  if (repayError) return { error: repayError };

  const amountMinor = toMinorUnits(data.amount, data.currency);
  const isCrossCurrency = destination && destination.currency !== data.currency;
  const transferToAmountMinor =
    isCrossCurrency && data.transferToAmount ? toMinorUnits(data.transferToAmount, destination!.currency) : null;

  if (data.status === "COMPLETED" && (data.type === "EXPENSE" || data.type === "TRANSFER")) {
    const balanceError = await checkSufficientBalance(userId, account, amountMinor, data.currency);
    if (balanceError) return { error: balanceError };
  }

  const creditedAccountId = data.type === "TRANSFER" ? (data.transferToAccountId ?? null) : data.type === "INCOME" ? data.accountId : null;
  const goalError = await validateGoalLink(userId, data.goalId, creditedAccountId);
  if (goalError) return { error: goalError };
  const credit = goalCredit({ type: data.type, amount: amountMinor, transferToAmount: transferToAmountMinor });
  // An upcoming transaction has not moved any money yet, so it does not count toward the goal.
  const goalOps = data.goalId && data.status === "COMPLETED" ? await goalAdjustment(data.goalId, credit) : [];

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
      status: data.status,
      repaysLoanId: data.repaysLoanId || null,
      tags: {
        create: data.tagIds.map((tagId) => ({ tagId })),
      },
      loan: data.loan
        ? {
            create: {
              userId,
              direction: data.loan.direction,
              counterpartyType: data.loan.counterpartyType,
              dueDate: data.loan.dueDate,
            },
          }
        : undefined,
    },
    }),
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

  const existing = await prisma.transaction.findFirst({ where: { id, userId }, include: { loan: true } });
  if (!existing) return { error: "Transaction not found" };

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

  const repayError = await validateRepaysLoan(userId, data.repaysLoanId, data.type);
  if (repayError) return { error: repayError };

  const amountMinor = toMinorUnits(data.amount, data.currency);
  const isCrossCurrency = destination && destination.currency !== data.currency;
  const transferToAmountMinor =
    isCrossCurrency && data.transferToAmount ? toMinorUnits(data.transferToAmount, destination!.currency) : null;

  if (data.status === "COMPLETED" && (data.type === "EXPENSE" || data.type === "TRANSFER")) {
    const balanceError = await checkSufficientBalance(userId, account, amountMinor, data.currency, {
      accountId: existing.accountId,
      type: existing.type,
      amount: existing.amount,
    });
    if (balanceError) return { error: balanceError };
  }

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
    goalId && data.status === "COMPLETED"
      ? { goalId, credit: goalCredit({ type: data.type, amount: amountMinor, transferToAmount: transferToAmountMinor }) }
      : null;
  const goalOps = (await Promise.all([...goalDeltas(before, after)].map(([gid, delta]) => goalAdjustment(gid, delta)))).flat();

  await prisma.$transaction([
    prisma.transactionTag.deleteMany({ where: { transactionId: id } }),
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
        status: data.status,
        repaysLoanId: data.repaysLoanId || null,
        tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
        // Present + no existing row → create it. Present + existing row → update it
        // (e.g. the due date changed). Absent + existing row → delete it — this is
        // the "settle by editing" path: unchecking the loan toggle in the form drops
        // the reminder. Absent + no existing row → omit the key entirely (no-op).
        loan: data.loan
          ? {
              upsert: {
                create: { userId, direction: data.loan.direction, counterpartyType: data.loan.counterpartyType, dueDate: data.loan.dueDate },
                update: { direction: data.loan.direction, counterpartyType: data.loan.counterpartyType, dueDate: data.loan.dueDate },
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
