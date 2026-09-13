"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { recurringSchema, type RecurringInput } from "@/lib/validations/recurring";
import { toMinorUnits } from "@/lib/money";

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

  const today = startOfDay(new Date());
  const nextOccurrence = data.startDate > today ? data.startDate : today;

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
      nextOccurrence,
      isSubscription: data.isSubscription,
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
