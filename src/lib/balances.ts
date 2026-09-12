import { prisma } from "@/lib/db";

/**
 * Computes every account's current balance in three aggregate queries,
 * regardless of transaction volume. Only COMPLETED transactions count —
 * UPCOMING ones must never move a real balance.
 */
export async function getAccountBalances(userId: string): Promise<Record<string, number>> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true, startingBalance: true },
  });

  const balances: Record<string, number> = {};
  for (const a of accounts) balances[a.id] = a.startingBalance;

  const grouped = await prisma.transaction.groupBy({
    by: ["accountId", "type"],
    where: { userId, status: "COMPLETED" },
    _sum: { amount: true },
  });
  for (const g of grouped) {
    const amt = g._sum.amount ?? 0;
    if (g.type === "INCOME") balances[g.accountId] = (balances[g.accountId] ?? 0) + amt;
    else if (g.type === "EXPENSE" || g.type === "TRANSFER") {
      balances[g.accountId] = (balances[g.accountId] ?? 0) - amt;
    }
  }

  const transfersIn = await prisma.transaction.groupBy({
    by: ["transferToAccountId"],
    where: { userId, status: "COMPLETED", type: "TRANSFER", transferToAccountId: { not: null } },
    _sum: { amount: true },
  });
  for (const t of transfersIn) {
    if (!t.transferToAccountId) continue;
    balances[t.transferToAccountId] = (balances[t.transferToAccountId] ?? 0) + (t._sum.amount ?? 0);
  }

  return balances;
}

export async function getAccountBalance(userId: string, accountId: string): Promise<number> {
  const balances = await getAccountBalances(userId);
  return balances[accountId] ?? 0;
}
