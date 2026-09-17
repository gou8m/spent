"use server";

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

  const match = await prisma.transaction.findFirst({
    where: { userId, type, title: { equals: trimmed, mode: "insensitive" }, categoryId: { not: null } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: { categoryId: true },
  });

  return { categoryId: match?.categoryId ?? null };
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

function revalidateAfterTransactionChange() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/budgets");
}

export async function createTransactionAction(input: TransactionInput): Promise<ActionResult> {
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

  const amountMinor = toMinorUnits(data.amount, data.currency);
  const isCrossCurrency = destination && destination.currency !== data.currency;
  const transferToAmountMinor =
    isCrossCurrency && data.transferToAmount ? toMinorUnits(data.transferToAmount, destination!.currency) : null;

  if (data.status === "COMPLETED" && (data.type === "EXPENSE" || data.type === "TRANSFER")) {
    const balanceError = await checkSufficientBalance(userId, account, amountMinor, data.currency);
    if (balanceError) return { error: balanceError };
  }

  await prisma.transaction.create({
    data: {
      userId,
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
  });

  revalidateAfterTransactionChange();
  return {};
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

  await prisma.$transaction([
    prisma.transactionTag.deleteMany({ where: { transactionId: id } }),
    prisma.transaction.update({
      where: { id },
      data: {
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
  return {};
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return { error: "Transaction not found" };

  await prisma.transaction.delete({ where: { id } });
  revalidateAfterTransactionChange();
  return {};
}
