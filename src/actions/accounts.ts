"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { accountSchema, type AccountInput } from "@/lib/validations/account";
import { toMinorUnits } from "@/lib/money";

export interface ActionResult {
  error?: string;
}

export async function createAccountAction(input: AccountInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };

  const count = await prisma.account.count({ where: { userId } });
  await prisma.account.create({
    data: {
      userId,
      name: parsed.data.name,
      type: parsed.data.type,
      currency: parsed.data.currency,
      startingBalance: toMinorUnits(parsed.data.startingBalance, parsed.data.currency),
      creditLimit:
        parsed.data.type === "CREDIT_CARD" && parsed.data.creditLimit
          ? toMinorUnits(parsed.data.creditLimit, parsed.data.currency)
          : null,
      icon: parsed.data.icon,
      color: parsed.data.color,
      sortOrder: count,
    },
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

  await prisma.account.update({
    where: { id },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      currency: parsed.data.currency,
      startingBalance: toMinorUnits(parsed.data.startingBalance, parsed.data.currency),
      creditLimit:
        parsed.data.type === "CREDIT_CARD" && parsed.data.creditLimit
          ? toMinorUnits(parsed.data.creditLimit, parsed.data.currency)
          : null,
      icon: parsed.data.icon,
      color: parsed.data.color,
    },
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
