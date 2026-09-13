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

  // Not a groupBy: a cross-currency transfer credits the destination account with
  // `transferToAmount`, not `amount` — that coalesce has to happen per-row in JS.
  const transfersIn = await prisma.transaction.findMany({
    where: { userId, status: "COMPLETED", type: "TRANSFER", transferToAccountId: { not: null } },
    select: { transferToAccountId: true, amount: true, transferToAmount: true },
  });
  for (const t of transfersIn) {
    if (!t.transferToAccountId) continue;
    balances[t.transferToAccountId] = (balances[t.transferToAccountId] ?? 0) + (t.transferToAmount ?? t.amount);
  }

  return balances;
}

export async function getAccountBalance(userId: string, accountId: string): Promise<number> {
  const balances = await getAccountBalances(userId);
  return balances[accountId] ?? 0;
}

/**
 * Bank-statement-style running balance: for every COMPLETED transaction, the
 * account balance immediately after it posted. Keyed by `${transactionId}:${accountId}`
 * because a transfer affects two accounts (the source leg and the destination
 * leg each get their own running value). UPCOMING transactions never appear
 * here — they don't move a real balance, same rule as `getAccountBalances`.
 *
 * Requires walking every completed transaction in chronological order, so
 * this is O(all completed transactions), not O(one page) — acceptable at the
 * current scale (see TODO.md performance-pass note) but the first thing to
 * revisit if a user's history grows large.
 */
export async function getRunningBalances(userId: string): Promise<Record<string, number>> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true, startingBalance: true },
  });

  const running: Record<string, number> = {};
  for (const a of accounts) running[a.id] = a.startingBalance;

  const transactions = await prisma.transaction.findMany({
    where: { userId, status: "COMPLETED" },
    select: { id: true, accountId: true, transferToAccountId: true, type: true, amount: true, transferToAmount: true },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const balancesByKey: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type === "INCOME") running[tx.accountId] = (running[tx.accountId] ?? 0) + tx.amount;
    else running[tx.accountId] = (running[tx.accountId] ?? 0) - tx.amount;
    balancesByKey[`${tx.id}:${tx.accountId}`] = running[tx.accountId];

    if (tx.type === "TRANSFER" && tx.transferToAccountId) {
      const creditAmount = tx.transferToAmount ?? tx.amount;
      running[tx.transferToAccountId] = (running[tx.transferToAccountId] ?? 0) + creditAmount;
      balancesByKey[`${tx.id}:${tx.transferToAccountId}`] = running[tx.transferToAccountId];
    }
  }

  return balancesByKey;
}
