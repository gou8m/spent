import { prisma } from "@/lib/db";

/** Goals don't store their own currency — they use the linked account's
 * currency when one is set, otherwise the user's primary currency. */
export async function getGoals(userId: string, currency: string, { includeArchived = false } = {}) {
  const goals = await prisma.goal.findMany({
    where: { userId, ...(includeArchived ? {} : { status: { not: "ARCHIVED" } }) },
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });

  return goals.map((goal) => {
    const goalCurrency = goal.account?.currency ?? currency;
    return {
      ...goal,
      currency: goalCurrency,
      percent: goal.targetAmount === 0 ? 0 : Math.min(100, (goal.currentAmount / goal.targetAmount) * 100),
      remaining: Math.max(0, goal.targetAmount - goal.currentAmount),
    };
  });
}

export async function getGoalById(userId: string, id: string, currency: string) {
  const goals = await getGoals(userId, currency, { includeArchived: true });
  return goals.find((g) => g.id === id) ?? null;
}
