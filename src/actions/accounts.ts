"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { accountSchema, type AccountInput } from "@/lib/validations/account";
import { toMinorUnits } from "@/lib/money";

export interface ActionResult {
  error?: string;
}

/** At most one Emergency Fund account per user (see schema comment) — not a DB
 * constraint, so every write path that can set the flag true clears it from every
 * other account first, in the same transaction as the actual create/update. */
async function clearOtherEmergencyFunds(tx: Prisma.TransactionClient, userId: string, exceptId?: string) {
  await tx.account.updateMany({
    where: { userId, isEmergencyFund: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { isEmergencyFund: false },
  });
}

export async function createAccountAction(input: AccountInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };

  const isEmergencyFund = parsed.data.type === "SAVINGS" && !!parsed.data.isEmergencyFund;
  const count = await prisma.account.count({ where: { userId } });

  await prisma.$transaction(async (tx) => {
    if (isEmergencyFund) await clearOtherEmergencyFunds(tx, userId);
    await tx.account.create({
      data: {
        userId,
        name: parsed.data.name,
        type: parsed.data.type,
        bankSubtype: parsed.data.type === "BANK" ? (parsed.data.bankSubtype ?? "SAVINGS") : null,
        currency: parsed.data.currency,
        startingBalance: toMinorUnits(parsed.data.startingBalance, parsed.data.currency),
        creditLimit:
          parsed.data.type === "CREDIT_CARD" && parsed.data.creditLimit
            ? toMinorUnits(parsed.data.creditLimit, parsed.data.currency)
            : null,
        allowExpense: parsed.data.type === "SAVINGS" ? (parsed.data.allowExpense ?? true) : true,
        isEmergencyFund,
        icon: parsed.data.icon,
        color: parsed.data.color,
        sortOrder: count,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return {};
}

export async function updateAccountAction(id: string, input: AccountInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };

  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) return { error: "Account not found" };

  const isEmergencyFund = parsed.data.type === "SAVINGS" && !!parsed.data.isEmergencyFund;

  await prisma.$transaction(async (tx) => {
    if (isEmergencyFund) await clearOtherEmergencyFunds(tx, userId, id);
    await tx.account.update({
      where: { id },
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        bankSubtype: parsed.data.type === "BANK" ? (parsed.data.bankSubtype ?? "SAVINGS") : null,
        currency: parsed.data.currency,
        startingBalance: toMinorUnits(parsed.data.startingBalance, parsed.data.currency),
        creditLimit:
          parsed.data.type === "CREDIT_CARD" && parsed.data.creditLimit
            ? toMinorUnits(parsed.data.creditLimit, parsed.data.currency)
            : null,
        allowExpense: parsed.data.type === "SAVINGS" ? (parsed.data.allowExpense ?? true) : true,
        isEmergencyFund,
        icon: parsed.data.icon,
        color: parsed.data.color,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return {};
}

export async function setAccountArchivedAction(id: string, isArchived: boolean): Promise<ActionResult> {
  const userId = await requireUserId();
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) return { error: "Account not found" };

  await prisma.account.update({ where: { id }, data: { isArchived } });
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return {};
}

/** Hard-deletes only when nothing references the account; otherwise archives it. */
export async function deleteAccountAction(id: string): Promise<ActionResult & { archived?: boolean }> {
  const userId = await requireUserId();
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) return { error: "Account not found" };

  const accountCount = await prisma.account.count({ where: { userId } });
  if (accountCount <= 1) return { error: "You need at least one account" };

  const txCount = await prisma.transaction.count({
    where: { userId, OR: [{ accountId: id }, { transferToAccountId: id }] },
  });

  if (txCount > 0) {
    await prisma.account.update({ where: { id }, data: { isArchived: true } });
    revalidatePath("/accounts");
    return { archived: true };
  }

  await prisma.account.delete({ where: { id } });
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return {};
}
