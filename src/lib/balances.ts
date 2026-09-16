import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Computes every account's current balance in three aggregate queries,
 * regardless of transaction volume. Only COMPLETED transactions count —
 * UPCOMING ones must never move a real balance.
 *
 * Wrapped in React's `cache()` (same convention as `getCurrentUser`) — this
 * is called from `getAccounts`, `getAccountById`, and directly from
 * `getDashboardData`, all of which can run in the same request (e.g. the app
 * shell's `getAccounts` plus a page's own `getAccounts` call); without this,
 * a single page load could recompute every account's balance two or three
 * times over.
 */
export const getAccountBalances = cache(async (userId: string): Promise<Record<string, number>> => {
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
});

export async function getAccountBalance(userId: string, accountId: string): Promise<number> {
  const balances = await getAccountBalances(userId);
  return balances[accountId] ?? 0;
}

/**
 * The balance actually available to debit from an account right now — used to stop
 * an EXPENSE/TRANSFER from overdrawing it. When editing an existing transaction that
 * already debited this same account, that transaction's own old effect is reversed
 * first (its amount is still baked into the current balance until the edit is saved),
 * so the check compares against what the balance would be *without* it rather than
 * double-counting it.
 */
export async function getAvailableBalanceForDebit(
  userId: string,
  accountId: string,
  excludeTransaction?: { accountId: string; type: string; amount: number },
): Promise<number> {
  const currentBalance = await getAccountBalance(userId, accountId);
  if (!excludeTransaction || excludeTransaction.accountId !== accountId) return currentBalance;

  return excludeTransaction.type === "INCOME"
    ? currentBalance - excludeTransaction.amount
    : currentBalance + excludeTransaction.amount; // EXPENSE, or TRANSFER's source leg
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

/**
 * The running balance for exactly one (transaction, account) pair — same ledger
 * definition as `getRunningBalances`, but scoped to a single account and a single
 * cutoff point instead of every account's entire history. Used by a transaction's
 * detail view, which only ever needs the one figure; calling the all-accounts
 * version there was doing a full-history scan of every account to read out a
 * single value.
 */
export async function getRunningBalanceAt(
  userId: string,
  accountId: string,
  cutoff: { date: Date; createdAt: Date; id: string },
): Promise<number> {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId }, select: { startingBalance: true } });
  if (!account) return 0;

  const rows = await prisma.$queryRaw<{ cumulative: number | null }[]>`
    WITH ledger AS (
      SELECT id, date, "createdAt" AS created_at,
        CASE WHEN type = 'INCOME' THEN amount ELSE -amount END AS delta
      FROM "Transaction"
      WHERE "userId" = ${userId} AND status = 'COMPLETED' AND "accountId" = ${accountId}
      UNION ALL
      SELECT id, date, "createdAt" AS created_at,
        COALESCE("transferToAmount", amount) AS delta
      FROM "Transaction"
      WHERE "userId" = ${userId} AND status = 'COMPLETED' AND type = 'TRANSFER' AND "transferToAccountId" = ${accountId}
    )
    SELECT SUM(delta)::integer AS cumulative
    FROM ledger
    WHERE (date, created_at, id) <= (${cutoff.date}, ${cutoff.createdAt}, ${cutoff.id})
  `;

  return account.startingBalance + (rows[0]?.cumulative ?? 0);
}
