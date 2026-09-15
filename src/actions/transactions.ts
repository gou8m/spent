"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { transactionSchema, type TransactionInput } from "@/lib/validations/transaction";
import { toMinorUnits } from "@/lib/money";
import { getTransactionById, getTransactions, TRANSACTIONS_PAGE_SIZE, type TransactionFilters } from "@/lib/data/transactions";

export interface ActionResult {
  error?: string;
}

export async function getTransactionAction(id: string) {
  const userId = await requireUserId();
  return getTransactionById(userId, id);
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

  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
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
