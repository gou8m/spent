import { addDays, addWeeks, addMonths, addYears, startOfDay, isAfter } from "date-fns";
import { prisma } from "@/lib/db";
import type { RecurringFrequency } from "@/lib/constants";

/** How far ahead to materialize UPCOMING transactions from an active recurring rule. */
const LOOKAHEAD_DAYS = 30;
/** Safety cap per rule per run — guards against a pathological rule (e.g. DAILY with a
 * long-stale nextOccurrence) generating an unbounded batch in one request. */
const MAX_OCCURRENCES_PER_RUN = 60;

function stepForward(date: Date, frequency: RecurringFrequency, interval: number): Date {
  switch (frequency) {
    case "DAILY":
      return addDays(date, interval);
    case "WEEKLY":
      return addWeeks(date, interval);
    case "MONTHLY":
      return addMonths(date, interval);
    case "YEARLY":
      return addYears(date, interval);
  }
}

/**
 * Materializes real Transaction rows for every active recurring rule whose schedule has
 * caught up to `now` (or falls within the lookahead window). Occurrences on/before today
 * are created COMPLETED (the charge has already happened); future ones are UPCOMING.
 * Safe to call on every relevant page load — a rule with nothing due yet is a no-op.
 */
export async function generateDueOccurrences(userId: string, now: Date = new Date()): Promise<void> {
  const today = startOfDay(now);
  const horizon = addDays(today, LOOKAHEAD_DAYS);

  const rules = await prisma.recurringTransaction.findMany({
    where: { userId, isActive: true, nextOccurrence: { lte: horizon } },
  });

  for (const rule of rules) {
    const occurrences: Date[] = [];
    let cursor = rule.nextOccurrence;

    while (
      occurrences.length < MAX_OCCURRENCES_PER_RUN &&
      !isAfter(cursor, horizon) &&
      (!rule.endDate || !isAfter(cursor, rule.endDate))
    ) {
      occurrences.push(cursor);
      cursor = stepForward(cursor, rule.frequency as RecurringFrequency, rule.interval);
    }

    if (occurrences.length === 0) continue;

    const ruleEnded = !!rule.endDate && isAfter(cursor, rule.endDate);

    await prisma.$transaction([
      prisma.transaction.createMany({
        data: occurrences.map((date) => ({
          userId,
          accountId: rule.accountId,
          categoryId: rule.categoryId,
          type: rule.type,
          amount: rule.amount,
          currency: rule.currency,
          title: rule.title,
          date,
          status: isAfter(date, today) ? "UPCOMING" : "COMPLETED",
          recurringTransactionId: rule.id,
        })),
      }),
      prisma.recurringTransaction.update({
        where: { id: rule.id },
        data: {
          nextOccurrence: cursor,
          lastGeneratedAt: now,
          ...(ruleEnded ? { isActive: false } : {}),
        },
      }),
    ]);
  }
}
