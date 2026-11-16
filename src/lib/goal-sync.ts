import { prisma } from "@/lib/db";

/** What a transaction adds to its goal, in the goal account's currency: a transfer credits the
 * destination with `transferToAmount` (cross-currency) or `amount`; an income credits `amount`;
 * a legacy "Contribution to…" expense counted its `amount` too. */
export function goalCredit(tx: { type: string; amount: number; transferToAmount: number | null }): number {
  return tx.type === "TRANSFER" ? (tx.transferToAmount ?? tx.amount) : tx.amount;
}

/**
 * The database operations that move a goal's saved amount by `delta` (negative to take back),
 * marking it completed once the target is reached and active again if an edit or delete drops it
 * below. Reads the goal fresh so the result is based on its current amount.
 */
export async function goalAdjustment(goalId: string, delta: number) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId }, select: { currentAmount: true, targetAmount: true, status: true } });
  if (!goal || delta === 0) return [];
  const next = Math.max(0, goal.currentAmount + delta);
  const status = goal.status === "ARCHIVED" ? "ARCHIVED" : next >= goal.targetAmount ? "COMPLETED" : "ACTIVE";
  return [prisma.goal.update({ where: { id: goalId }, data: { currentAmount: next, status } })];
}

/** Net change per goal when a transaction's goal link goes from `before` to `after`
 * (either may be null): the old credit is taken back, the new one added. */
export function goalDeltas(
  before: { goalId: string; credit: number } | null,
  after: { goalId: string; credit: number } | null,
): Map<string, number> {
  const deltas = new Map<string, number>();
  if (before) deltas.set(before.goalId, (deltas.get(before.goalId) ?? 0) - before.credit);
  if (after) deltas.set(after.goalId, (deltas.get(after.goalId) ?? 0) + after.credit);
  return deltas;
}
