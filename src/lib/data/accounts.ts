import { prisma } from "@/lib/db";
import { getAccountBalances } from "@/lib/balances";

export async function getAccounts(userId: string, { includeArchived = false } = {}) {
  const accounts = await prisma.account.findMany({
    where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const balances = await getAccountBalances(userId);

  return accounts.map((account) => ({
    ...account,
    balance: balances[account.id] ?? account.startingBalance,
  }));
}

export async function getAccountById(userId: string, id: string) {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) return null;
  const balances = await getAccountBalances(userId);
  return { ...account, balance: balances[id] ?? account.startingBalance };
}
