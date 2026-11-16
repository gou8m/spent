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

export interface PriceChange {
  previous: number;
  latest: number;
  currency: string;
}

/** For every active subscription, the last two generated charges when their amounts
 * differ (same rule the "price changed" notification uses). Keyed by rule id. */
export async function getSubscriptionPriceChanges(userId: string): Promise<Record<string, PriceChange>> {
  const subs = await prisma.recurringTransaction.findMany({ where: { userId, isSubscription: true, isActive: true }, select: { id: true } });
  const entries = await Promise.all(
    subs.map(async (sub) => {
      const [latest, previous] = await prisma.transaction.findMany({
        where: { userId, recurringTransactionId: sub.id, status: "COMPLETED" },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 2,
      });
      if (!latest || !previous || latest.currency !== previous.currency || latest.amount === previous.amount) return null;
      return [sub.id, { previous: previous.amount, latest: latest.amount, currency: latest.currency }] as const;
    }),
  );
  return Object.fromEntries(entries.filter((e): e is NonNullable<typeof e> => e !== null));
}
