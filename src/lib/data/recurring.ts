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
