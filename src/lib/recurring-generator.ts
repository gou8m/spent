import { addDays, startOfDay, isAfter } from "date-fns";
import { prisma } from "@/lib/db";
import { amountOn, isDayRule, stepForward, type DayRule, type RecurringFrequency } from "@/lib/recurrence";

/** How far ahead to materialize UPCOMING transactions from an active recurring rule. */
const LOOKAHEAD_DAYS = 30;
/** Safety cap per rule per run — guards against a pathological rule (e.g. DAILY with a
 * long-stale nextOccurrence) generating an unbounded batch in one request. */
const MAX_OCCURRENCES_PER_RUN = 60;

/**
 * Materializes real Transaction rows for every active recurring rule whose schedule has
 * caught up to `now` (or falls within the lookahead window). Occurrences on/before today
 * are created COMPLETED (the charge has already happened); future ones are UPCOMING.
 * Safe to call on every relevant page load — a rule with nothing due yet is a no-op.
 */
export async function generateDueOccurrences(userId: string, now: Date = new Date()): Promise<void> {
  const today = startOfDay(now);
  const horizon = addDays(today, LOOKAHEAD_DAYS);

  // Pending items whose day has arrived become completed. Without this a charge created ahead of time
  // (we create the next 30 days) stayed "pending" forever, even for a date long past. Items that need the
  // person to confirm the real amount (a salary that changes each month) are left pending on purpose.
  await prisma.transaction.updateMany({
    where: {
      userId,
      status: "UPCOMING",
      date: { lte: today },
      OR: [{ recurringTransactionId: null }, { recurring: { amountVaries: false } }],
    },
    data: { status: "COMPLETED" },
  });

  const rules = await prisma.recurringTransaction.findMany({
    where: { userId, isActive: true, nextOccurrence: { lte: horizon } },
  });

  for (const rule of rules) {
    const occurrences: Date[] = [];
    let cursor = rule.nextOccurrence;
    const anchorDay = rule.startDate.getUTCDate();
    const dayRule: DayRule = isDayRule(rule.dayRule) ? rule.dayRule : "DAY";

    while (
      occurrences.length < MAX_OCCURRENCES_PER_RUN &&
      !isAfter(cursor, horizon) &&
      (!rule.endDate || !isAfter(cursor, rule.endDate))
    ) {
      occurrences.push(cursor);
      cursor = stepForward(cursor, rule.frequency as RecurringFrequency, rule.interval, anchorDay, dayRule);
    }

    if (occurrences.length === 0) continue;

    const ruleEnded = !!rule.endDate && isAfter(cursor, rule.endDate);

    // This runs opportunistically from several unrelated data-fetch paths (dashboard,
    // transactions list, the recurring page itself) that can all be in flight at once —
    // e.g. Next.js's <Link> prefetching alone can trigger two or three of them for the
    // same request. Without a guard, each reads the same stale `nextOccurrence` and
    // independently generates the same batch, tripling (or worse) every occurrence.
    // `updateMany` with the originally-read `nextOccurrence` in the WHERE clause makes
    // the advance an atomic compare-and-swap: only the first caller to commit actually
    // matches a row, so every other concurrent caller sees `count === 0` and skips
    // creating its (now-stale) batch instead of duplicating it.
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.recurringTransaction.updateMany({
        where: { id: rule.id, nextOccurrence: rule.nextOccurrence },
        data: {
          nextOccurrence: cursor,
          lastGeneratedAt: now,
          ...(ruleEnded ? { isActive: false } : {}),
        },
      });
      if (claimed.count === 0) return;

      await tx.transaction.createMany({
        data: occurrences.map((date) => ({
          userId,
          accountId: rule.accountId,
          categoryId: rule.categoryId,
          type: rule.type,
          amount: amountOn(rule, date),
          currency: rule.currency,
          title: rule.title,
          date,
          // A changing amount stays pending until it is confirmed, whatever the date.
          status: rule.amountVaries || isAfter(date, today) ? "UPCOMING" : "COMPLETED",
          recurringTransactionId: rule.id,
        })),
      });
    });
  }
}

const lastRun = new Map<string, number>();

/** For frequent read paths (the transactions list, its live result count): at most once every 30 seconds
 * per person. Due occurrences are still materialised promptly, without a database round trip on every filter tap. */
export async function generateDueOccurrencesThrottled(userId: string): Promise<void> {
  const now = Date.now();
  if (now - (lastRun.get(userId) ?? 0) < 30_000) return;
  lastRun.set(userId, now);
  await generateDueOccurrences(userId);
}

/**
 * The dates a recurring rule will fall on between `from` and `to`, without creating anything. The
 * calendar uses it for months beyond the 30 days of upcoming transactions that already exist.
 */
export function projectOccurrences(
  rule: { nextOccurrence: Date; startDate: Date; endDate: Date | null; frequency: string; interval: number; dayRule?: string },
  from: Date,
  to: Date,
): Date[] {
  const out: Date[] = [];
  let cursor = rule.nextOccurrence;
  const anchorDay = rule.startDate.getUTCDate();
  const dayRule: DayRule = rule.dayRule && isDayRule(rule.dayRule) ? rule.dayRule : "DAY";
  let guard = 0;
  while (!isAfter(cursor, to) && guard++ < 400) {
    if (rule.endDate && isAfter(cursor, rule.endDate)) break;
    if (!isAfter(from, cursor)) out.push(cursor);
    cursor = stepForward(cursor, rule.frequency as RecurringFrequency, rule.interval, anchorDay, dayRule);
  }
  return out;
}
