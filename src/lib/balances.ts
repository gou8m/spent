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
 * Computed as a single indexed SQL window-function query rather than pulling
 * every COMPLETED transaction into Node and replaying them in a loop — the
 * previous version was O(all completed transactions) on every /transactions
 * page load regardless of how many rows are actually displayed (the page
 * itself is paginated, but this wasn't). A transfer contributes two ledger
 * rows (source debit + destination credit via the UNION ALL), and Postgres
 * accumulates each account's running total in one pass.
 */
export async function getRunningBalances(userId: string): Promise<Record<string, number>> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true, startingBalance: true },
  });
  const startingBalances = new Map(accounts.map((a) => [a.id, a.startingBalance]));

  const rows = await prisma.$queryRaw<{ id: string; account_id: string; cumulative: number }[]>`
    WITH ledger AS (
      SELECT id, "accountId" AS account_id, date, "createdAt" AS created_at,
        CASE WHEN type = 'INCOME' THEN amount ELSE -amount END AS delta
      FROM "Transaction"
      WHERE "userId" = ${userId} AND status = 'COMPLETED'
      UNION ALL
      SELECT id, "transferToAccountId" AS account_id, date, "createdAt" AS created_at,
        COALESCE("transferToAmount", amount) AS delta
      FROM "Transaction"
      WHERE "userId" = ${userId} AND status = 'COMPLETED' AND type = 'TRANSFER' AND "transferToAccountId" IS NOT NULL
    )
    SELECT id, account_id,
      (SUM(delta) OVER (
        PARTITION BY account_id ORDER BY date, created_at, id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ))::integer AS cumulative
    FROM ledger
  `;

  const balancesByKey: Record<string, number> = {};
  for (const row of rows) {
    balancesByKey[`${row.id}:${row.account_id}`] = (startingBalances.get(row.account_id) ?? 0) + row.cumulative;
  }
  return balancesByKey;
}
