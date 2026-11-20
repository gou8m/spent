"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { recurringSchema, type RecurringInput } from "@/lib/validations/recurring";
import { MAX_MINOR_UNITS, toMinorUnits } from "@/lib/money";
import { firstOccurrence, stepForward } from "@/lib/recurrence";

export interface ActionResult {
  error?: string;
}

export async function createRecurringAction(input: RecurringInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = recurringSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };
  const data = parsed.data;

  const account = await prisma.account.findFirst({ where: { id: data.accountId, userId } });
  if (!account) return { error: "Account not found" };

  await prisma.recurringTransaction.create({
    data: {
      userId,
      accountId: data.accountId,
      categoryId: data.categoryId,
      title: data.title,
      amount: toMinorUnits(data.amount, account.currency),
      currency: account.currency,
      type: data.type,
      frequency: data.frequency,
      interval: data.interval,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      // Start from the actual chosen date, even if it's in the past — generateDueOccurrences
      // walks forward from here and backfills every occurrence up to today as COMPLETED.
      // Clamping this to today (the old behavior) silently dropped any past-dated occurrence.
      nextOccurrence: data.skipFirst
        ? stepForward(firstOccurrence(data.startDate, data.frequency, data.dayRule), data.frequency, data.interval, data.startDate.getUTCDate(), data.dayRule)
        : firstOccurrence(data.startDate, data.frequency, data.dayRule),
      isSubscription: data.isSubscription,
      dayRule: data.dayRule,
      amountVaries: data.amountVaries,
      bonusAmount: data.bonusAmount !== undefined ? toMinorUnits(data.bonusAmount, account.currency) : null,
      bonusEveryMonths: data.bonusEveryMonths ?? null,
    },
  });

  revalidatePath("/recurring");
  revalidatePath("/dashboard");
  return {};
}

export async function updateRecurringAction(id: string, input: RecurringInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = recurringSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };
  const data = parsed.data;

  const rule = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
  if (!rule) return { error: "Recurring transaction not found" };

  const account = await prisma.account.findFirst({ where: { id: data.accountId, userId } });
  if (!account) return { error: "Account not found" };

  await prisma.recurringTransaction.update({
    where: { id },
    data: {
      accountId: data.accountId,
      categoryId: data.categoryId,
      title: data.title,
      amount: toMinorUnits(data.amount, account.currency),
      currency: account.currency,
      type: data.type,
      frequency: data.frequency,
      interval: data.interval,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      isSubscription: data.isSubscription,
      dayRule: data.dayRule,
      amountVaries: data.amountVaries,
      bonusAmount: data.bonusAmount !== undefined ? toMinorUnits(data.bonusAmount, account.currency) : null,
      bonusEveryMonths: data.bonusEveryMonths ?? null,
      // A rule that has not created anything yet starts over from its new settings; one with history keeps
      // its place and only re-snaps to the new day rule.
      nextOccurrence:
        (await prisma.transaction.count({ where: { recurringTransactionId: id } })) === 0
          ? firstOccurrence(data.startDate, data.frequency, data.dayRule)
          : data.dayRule !== rule.dayRule
            ? firstOccurrence(rule.nextOccurrence, data.frequency, data.dayRule)
            : rule.nextOccurrence,
    },
  });

  revalidatePath("/recurring");
  revalidatePath("/dashboard");
  return {};
}

export async function setRecurringActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  const userId = await requireUserId();
  const rule = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
  if (!rule) return { error: "Recurring transaction not found" };

  await prisma.recurringTransaction.update({ where: { id }, data: { isActive } });
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
  return {};
}

/** Hard-deletes only when it never generated a transaction; otherwise pauses it (no "archived" concept here, isActive:false serves the same purpose). */
export async function deleteRecurringAction(id: string): Promise<ActionResult & { paused?: boolean }> {
  const userId = await requireUserId();
  const rule = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
  if (!rule) return { error: "Recurring transaction not found" };

  const txCount = await prisma.transaction.count({ where: { recurringTransactionId: id } });
  if (txCount > 0) {
    await prisma.recurringTransaction.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/recurring");
    return { paused: true };
  }

  await prisma.recurringTransaction.delete({ where: { id } });
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
  return {};
}

/** A smart prompt for the recurring form: what the person last paid (or received) under the same title. */
export async function lookupRecurringHintAction(
  title: string,
  type: "EXPENSE" | "INCOME",
): Promise<{ amount: number; currency: string; accountId: string; accountName: string; categoryId: string | null } | null> {
  const userId = await requireUserId();
  const trimmed = title.trim();
  if (trimmed.length < 2 || trimmed.length > 120) return null;

  const last = await prisma.transaction.findFirst({
    where: { userId, type, status: "COMPLETED", title: { equals: trimmed, mode: "insensitive" } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: { amount: true, currency: true, accountId: true, categoryId: true, account: { select: { name: true } } },
  });
  if (!last) return null;
  return { amount: last.amount, currency: last.currency, accountId: last.accountId, accountName: last.account.name, categoryId: last.categoryId };
}

/**
 * The prompt on the due date of an "ask me each time" item: confirm the usual amount, or enter a different one.
 * The pending transaction becomes completed, so it only now counts in the account's balance.
 */
export async function confirmRecurringOccurrenceAction(id: string, amount?: number): Promise<ActionResult> {
  const userId = await requireUserId();
  const tx = await prisma.transaction.findFirst({
    where: { id, userId, status: "UPCOMING", date: { lte: new Date() }, recurring: { amountVaries: true } },
    select: { id: true, currency: true, amount: true },
  });
  if (!tx) return { error: "This one is already confirmed" };

  let minor = tx.amount;
  if (amount !== undefined) {
    if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount above 0" };
    minor = toMinorUnits(amount, tx.currency);
    if (minor <= 0) return { error: "Enter an amount above 0" };
    if (minor > MAX_MINOR_UNITS) return { error: "Amount is too large" };
  }

  await prisma.transaction.update({ where: { id: tx.id }, data: { amount: minor, status: "COMPLETED" } });
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/recurring");
  return {};
}
