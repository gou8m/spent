import { prisma } from "@/lib/db";
import { generateDueOccurrences } from "@/lib/recurring-generator";

const RECURRING_INCLUDE = {
  account: true,
  category: true,
} as const;

export async function getRecurringTransactions(userId: string) {
  await generateDueOccurrences(userId);
  return prisma.recurringTransaction.findMany({
    where: { userId },
    include: RECURRING_INCLUDE,
    orderBy: [{ isActive: "desc" }, { nextOccurrence: "asc" }],
  });
}

export async function getRecurringById(userId: string, id: string) {
  return prisma.recurringTransaction.findFirst({ where: { id, userId }, include: RECURRING_INCLUDE });
}

export interface DueConfirmation {
  id: string;
  title: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  accountName: string;
}

/** Pending items of "ask me each time" rules whose day has arrived, oldest first. */
export async function getDueConfirmations(userId: string): Promise<DueConfirmation[]> {
  const rows = await prisma.transaction.findMany({
    where: { userId, status: "UPCOMING", date: { lte: new Date() }, recurring: { amountVaries: true, isActive: true } },
    orderBy: { date: "asc" },
    take: 10,
    select: { id: true, title: true, type: true, amount: true, currency: true, date: true, account: { select: { name: true } } },
  });
  return rows.map((r) => ({ id: r.id, title: r.title, type: r.type, amount: r.amount, currency: r.currency, date: r.date.toISOString(), accountName: r.account.name }));
}
