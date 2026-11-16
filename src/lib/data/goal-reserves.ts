import { cache } from "react";
import { prisma } from "@/lib/db";

export interface GoalReserve {
  /** Minor units, in the account's currency: what its goals have set aside inside it. */
  reserved: number;
  goals: { id: string; name: string; amount: number; targetAmount: number; status: string }[];
}

/**
 * For every account that goals are saved in: how much of its balance belongs to those goals.
 * A goal's `accountId` is where its money lives, and `currentAmount` is how much of that account
 * is spoken for, so an account's free money is its balance minus the sum below. Archived goals
 * no longer hold money back.
 */
export const getGoalReserves = cache(async (userId: string): Promise<Record<string, GoalReserve>> => {
  const goals = await prisma.goal.findMany({
    where: { userId, accountId: { not: null }, status: { not: "ARCHIVED" } },
    select: { id: true, name: true, accountId: true, currentAmount: true, targetAmount: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const reserves: Record<string, GoalReserve> = {};
  for (const g of goals) {
    if (!g.accountId) continue;
    const entry = (reserves[g.accountId] ??= { reserved: 0, goals: [] });
    entry.reserved += g.currentAmount;
    entry.goals.push({ id: g.id, name: g.name, amount: g.currentAmount, targetAmount: g.targetAmount, status: g.status });
  }
  return reserves;
});
