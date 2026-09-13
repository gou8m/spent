"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { transactionSchema, type TransactionInput } from "@/lib/validations/transaction";
import { toMinorUnits } from "@/lib/money";
import { getTransactionById } from "@/lib/data/transactions";
import { applyDenominationDelta, type DenominationCounts } from "@/lib/denominations";
import { Prisma } from "@prisma/client";

export interface ActionResult {
  error?: string;
}

export async function getTransactionAction(id: string) {
  const userId = await requireUserId();
  return getTransactionById(userId, id);
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

  const hasDenominations =
    data.type !== "TRANSFER" && account.type === "CASH" && !!data.denominations && Object.keys(data.denominations).length > 0;

  const writes: Prisma.PrismaPromise<unknown>[] = [
    prisma.transaction.create({
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
        denominations: hasDenominations ? data.denominations : undefined,
        tags: {
          create: data.tagIds.map((tagId) => ({ tagId })),
        },
      },
    }),
  ];

  if (hasDenominations) {
    const direction = data.type === "EXPENSE" ? "subtract" : "add";
    const next = applyDenominationDelta(account.cashDenominations as DenominationCounts | null, data.denominations!, direction);
    writes.push(prisma.account.update({ where: { id: account.id }, data: { cashDenominations: next } }));
  }

  await prisma.$transaction(writes);

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
 
  // Reverse the old transaction's denomination effect (if any) before applying the new
  // one — tracked per affected account so an accountId change (or a same-account edit)
  // both settle correctly, applied in a single batch of account updates below.
  const accountDenomUpdates = new Map<string, DenominationCounts | null>();
  const oldDenominations = existing.denominations as DenominationCounts | null;
  if (oldDenominations && Object.keys(oldDenominations).length > 0 && existing.type !== "TRANSFER") {
    const oldAccount =
      existing.accountId === account.id ? account : await prisma.account.findFirst({ where: { id: existing.accountId, userId } });
    if (oldAccount) {
      const reverseDirection = existing.type === "EXPENSE" ? "add" : "subtract";
      accountDenomUpdates.set(oldAccount.id, applyDenominationDelta(oldAccount.cashDenominations as DenominationCounts | null, oldDenominations, reverseDirection));
    }
  }

  const hasNewDenominations =
    data.type !== "TRANSFER" && account.type === "CASH" && !!data.denominations && Object.keys(data.denominations).length > 0;
  if (hasNewDenominations) {
    const base = accountDenomUpdates.get(account.id) ?? (account.cashDenominations as DenominationCounts | null);
    const direction = data.type === "EXPENSE" ? "subtract" : "add";
    accountDenomUpdates.set(account.id, applyDenominationDelta(base, data.denominations!, direction));
  }

  const writes: Prisma.PrismaPromise<unknown>[] = [];
  for (const [accountId, denominations] of accountDenomUpdates) {
    writes.push(prisma.account.update({ where: { id: accountId }, data: { cashDenominations: denominations ?? Prisma.JsonNull } }));
  }
  writes.push(
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
        denominations: hasNewDenominations ? data.denominations : Prisma.JsonNull,
        tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
      },
    }),
  );

  await prisma.$transaction(writes);

  revalidateAfterTransactionChange();
  return {};
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return { error: "Transaction not found" };

  const writes: Prisma.PrismaPromise<unknown>[] = [];
  const denominations = existing.denominations as DenominationCounts | null;
  if (denominations && Object.keys(denominations).length > 0 && existing.type !== "TRANSFER") {
    const account = await prisma.account.findFirst({ where: { id: existing.accountId, userId } });
    if (account) {
      const reverseDirection = existing.type === "EXPENSE" ? "add" : "subtract";
      const reversed = applyDenominationDelta(account.cashDenominations as DenominationCounts | null, denominations, reverseDirection);
      writes.push(prisma.account.update({ where: { id: account.id }, data: { cashDenominations: reversed } }));
    }
  }
  writes.push(prisma.transaction.delete({ where: { id } }));
  await prisma.$transaction(writes);
  revalidateAfterTransactionChange();
  return {};
}
