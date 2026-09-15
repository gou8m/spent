import { cache } from "react";
import { prisma } from "@/lib/db";
import { getAccountBalances } from "@/lib/balances";

/** Cached per-request (same convention as `getCurrentUser`) — the app shell already
 * fetches this for the global "Add transaction" sheet, and most pages fetch it again
 * for their own use; de-duping means that's one query instead of two per page load. */
export const getAccounts = cache(async (userId: string, { includeArchived = false } = {}) => {
  const accounts = await prisma.account.findMany({
    where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const balances = await getAccountBalances(userId);

  return accounts.map((account) => ({
    ...account,
    balance: balances[account.id] ?? account.startingBalance,
  }));
});

export async function getAccountById(userId: string, id: string) {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) return null;
  const balances = await getAccountBalances(userId);
  return { ...account, balance: balances[id] ?? account.startingBalance };
}
