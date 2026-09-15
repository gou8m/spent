import { cache } from "react";
import { subMonths, startOfMonth } from "date-fns";
import { prisma } from "@/lib/db";

const OWNER_EMAIL = "hellogouthamk@gmail.com";
const REQUIRED_ACTIVE_DAYS_PER_MONTH = 20;
const REQUIRED_CONSECUTIVE_MONTHS = 6;

/**
 * A verified badge for genuinely active users — not identity verification.
 * "Active" means logging at least one transaction that day. Requires
 * REQUIRED_ACTIVE_DAYS_PER_MONTH active days in each of the last
 * REQUIRED_CONSECUTIVE_MONTHS full calendar months (the current, still-in-
 * progress month never counts, so this can only newly turn on right after a
 * month rolls over). The app owner's account is verified unconditionally.
 */
export const isUserVerified = cache(async (userId: string, email: string): Promise<boolean> => {
  if (email.toLowerCase() === OWNER_EMAIL) return true;

  const rangeEnd = startOfMonth(new Date());
  const rangeStart = subMonths(rangeEnd, REQUIRED_CONSECUTIVE_MONTHS);

  const transactions = await prisma.transaction.findMany({
    where: { userId, createdAt: { gte: rangeStart, lt: rangeEnd } },
    select: { createdAt: true },
  });

  const activeDaysByMonth = new Map<string, Set<number>>();
  for (const t of transactions) {
    const key = `${t.createdAt.getFullYear()}-${t.createdAt.getMonth()}`;
    if (!activeDaysByMonth.has(key)) activeDaysByMonth.set(key, new Set());
    activeDaysByMonth.get(key)!.add(t.createdAt.getDate());
  }

  for (let i = 1; i <= REQUIRED_CONSECUTIVE_MONTHS; i++) {
    const monthDate = subMonths(rangeEnd, i);
    const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
    const activeDays = activeDaysByMonth.get(key)?.size ?? 0;
    if (activeDays < REQUIRED_ACTIVE_DAYS_PER_MONTH) return false;
  }
  return true;
});
