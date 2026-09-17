import { prisma } from "@/lib/db";
import { getRunningBalanceAt } from "@/lib/balances";
import { generateDueOccurrences } from "@/lib/recurring-generator";
import type { Prisma } from "@prisma/client";

export const TRANSACTIONS_PAGE_SIZE = 40;

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: "EXPENSE" | "INCOME" | "TRANSFER";
  status?: "COMPLETED" | "UPCOMING";
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

const TRANSACTION_INCLUDE = {
  account: true,
  transferToAccount: true,
  category: true,
  tags: { include: { tag: true } },
  loan: true,
} satisfies Prisma.TransactionInclude;

export async function getTransactions(userId: string, filters: TransactionFilters = {}) {
  await generateDueOccurrences(userId);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;

  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(filters.accountId ? { OR: [{ accountId: filters.accountId }, { transferToAccountId: filters.accountId }] } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search } },
            { note: { contains: filters.search } },
          ],
        }
      : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          date: {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {}),
          },
        }
      : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: TRANSACTION_INCLUDE,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page, pageSize, hasMore: page * pageSize < total };
}

export async function getRecentTransactions(userId: string, limit = 6) {
  return prisma.transaction.findMany({
    where: { userId, status: "COMPLETED" },
    include: TRANSACTION_INCLUDE,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getUpcomingTransactions(userId: string, limit = 6) {
  return prisma.transaction.findMany({
    where: { userId, status: "UPCOMING", date: { gte: new Date() } },
    include: TRANSACTION_INCLUDE,
    orderBy: { date: "asc" },
    take: limit,
  });
}

export async function getTransactionById(userId: string, id: string) {
  const transaction = await prisma.transaction.findFirst({ where: { id, userId }, include: TRANSACTION_INCLUDE });
  if (!transaction) return null;

  // Only a COMPLETED transaction has moved a real balance — same rule getRunningBalances itself follows.
  let runningBalance: number | undefined;
  if (transaction.status === "COMPLETED") {
    runningBalance = await getRunningBalanceAt(userId, transaction.accountId, {
      date: transaction.date,
      createdAt: transaction.createdAt,
      id: transaction.id,
    });
  }

  return { ...transaction, runningBalance };
}

export type TransactionWithRelations = Prisma.TransactionGetPayload<{ include: typeof TRANSACTION_INCLUDE }>;
