"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { goalSchema, contributeSchema, type GoalInput, type ContributeInput } from "@/lib/validations/goal";
import { toMinorUnits, formatMoney, MAX_MINOR_UNITS } from "@/lib/money";
import { getAccountBalance } from "@/lib/balances";

export interface ActionResult {
  error?: string;
}

async function validateAccount(userId: string, accountId: string | null | undefined) {
  if (!accountId) return null;
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new Error("Linked account is invalid");
  return account;
}

export async function createGoalAction(input: GoalInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };
  const data = parsed.data;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { currency: true } });
  let account;
  try {
    account = await validateAccount(userId, data.accountId);
  } catch {
    return { error: "Linked account is invalid" };
  }
  const currency = account?.currency ?? user.currency;

  await prisma.goal.create({
    data: {
      userId,
      name: data.name,
      targetAmount: toMinorUnits(data.targetAmount, currency),
      targetDate: data.targetDate ?? null,
      accountId: data.accountId ?? null,
      icon: data.icon,
      color: data.color,
    },
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return {};
}

export async function updateGoalAction(id: string, input: GoalInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };
  const data = parsed.data;

  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) return { error: "Goal not found" };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { currency: true } });
  let account;
  try {
    account = await validateAccount(userId, data.accountId);
  } catch {
    return { error: "Linked account is invalid" };
  }
  const currency = account?.currency ?? user.currency;

  await prisma.goal.update({
    where: { id },
    data: {
      name: data.name,
      targetAmount: toMinorUnits(data.targetAmount, currency),
      targetDate: data.targetDate ?? null,
      accountId: data.accountId ?? null,
      icon: data.icon,
      color: data.color,
    },
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return {};
}

export async function setGoalStatusAction(id: string, status: "ACTIVE" | "ARCHIVED"): Promise<ActionResult> {
  const userId = await requireUserId();
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) return { error: "Goal not found" };

  await prisma.goal.update({ where: { id }, data: { status } });
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return {};
}

/** Hard-deletes only when nothing references the goal; otherwise archives it. */
export async function deleteGoalAction(id: string): Promise<ActionResult & { archived?: boolean }> {
  const userId = await requireUserId();
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) return { error: "Goal not found" };

  const contributionCount = await prisma.transaction.count({ where: { goalId: id } });
  if (contributionCount > 0) {
    await prisma.goal.update({ where: { id }, data: { status: "ARCHIVED" } });
    revalidatePath("/goals");
    return { archived: true };
  }

  await prisma.goal.delete({ where: { id } });
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return {};
}

/** Adds money to a goal.
 *
 * With a saving account, the money is already in that account, so this only SETS ASIDE part of what is
 * free there (balance minus what its goals already hold): nothing is debited and no transaction is
 * recorded. Money arriving later is set aside by marking the income or transfer "for a goal" instead.
 * Without a saving account the goal is tracked by hand and its saved amount is just raised. */
export async function contributeToGoalAction(id: string, input: ContributeInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = contributeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid amount" };

  const goal = await prisma.goal.findFirst({ where: { id, userId }, include: { account: true } });
  if (!goal) return { error: "Goal not found" };
  if (goal.status !== "ACTIVE") return { error: "This goal isn't active" };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { currency: true } });
  const currency = goal.account?.currency ?? user.currency;
  const amountMinor = toMinorUnits(parsed.data.amount, currency);

  if (goal.accountId) {
    const [balance, held] = await Promise.all([
      getAccountBalance(userId, goal.accountId),
      prisma.goal.aggregate({ where: { userId, accountId: goal.accountId, status: { not: "ARCHIVED" } }, _sum: { currentAmount: true } }),
    ]);
    const free = balance - (held._sum.currentAmount ?? 0);
    if (amountMinor > free) {
      return {
        error: `Only ${formatMoney(Math.max(0, free), currency)} of "${goal.account?.name}" is free. The rest is already set aside for goals.`,
      };
    }
  }

  const newAmount = goal.currentAmount + amountMinor;
  if (newAmount > MAX_MINOR_UNITS) return { error: "Amount is too large" };
  const newStatus = newAmount >= goal.targetAmount ? "COMPLETED" : "ACTIVE";
  await prisma.goal.update({ where: { id }, data: { currentAmount: newAmount, status: newStatus } });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  return {};
}

/** The goal detail screen's contribution history. */
export async function getGoalContributionsAction(goalId: string) {
  const userId = await requireUserId();
  return prisma.transaction.findMany({
    where: { userId, goalId },
    include: { account: true },
    orderBy: { date: "desc" },
  });
}
