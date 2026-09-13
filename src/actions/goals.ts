"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { goalSchema, contributeSchema, type GoalInput, type ContributeInput } from "@/lib/validations/goal";
import { toMinorUnits } from "@/lib/money";

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

/** Contributing to a goal with a linked account records a real EXPENSE
 * transaction debiting that account (money actually moving toward the
 * goal) — a goal with no linked account just bumps currentAmount directly. */
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
  const newAmount = goal.currentAmount + amountMinor;
  const newStatus = newAmount >= goal.targetAmount ? "COMPLETED" : "ACTIVE";

  await prisma.$transaction([
    prisma.goal.update({ where: { id }, data: { currentAmount: newAmount, status: newStatus } }),
    ...(goal.accountId
      ? [
          prisma.transaction.create({
            data: {
              userId,
              accountId: goal.accountId,
              type: "EXPENSE",
              amount: amountMinor,
              currency,
              title: `Contribution to ${goal.name}`,
              date: new Date(),
              status: "COMPLETED",
              goalId: id,
            },
          }),
        ]
      : []),
  ]);

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  if (goal.accountId) {
    revalidatePath("/accounts");
    revalidatePath("/transactions");
  }
  return {};
}
