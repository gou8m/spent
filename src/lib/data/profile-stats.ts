import { cache } from "react";
import { prisma } from "@/lib/db";

export const HEAT_WEEKS = 12;

export interface ProfileStats {
  logged: number;
  accounts: number;
  streak: number;
  /** One entry per day for the last HEAT_WEEKS weeks, oldest first, starting on a Monday. */
  heat: { key: string; count: number; future: boolean }[];
  activeDays: number;
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Numbers for the Settings page: how much the person has logged and how steadily. */
export const getProfileStats = cache(async (userId: string): Promise<ProfileStats> => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  // Monday of this week, then back HEAT_WEEKS - 1 more weeks.
  const sinceMonday = new Date(today);
  sinceMonday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  const start = new Date(sinceMonday);
  start.setUTCDate(start.getUTCDate() - (HEAT_WEEKS - 1) * 7);
  const streakFrom = new Date(today);
  streakFrom.setUTCDate(streakFrom.getUTCDate() - 400);

  const [logged, accounts, recent] = await Promise.all([
    prisma.transaction.count({ where: { userId, status: "COMPLETED" } }),
    prisma.account.count({ where: { userId } }),
    prisma.transaction.findMany({
      where: { userId, status: "COMPLETED", date: { gte: start < streakFrom ? start : streakFrom, lte: new Date(today.getTime() + 86_400_000 - 1) } },
      select: { date: true },
    }),
  ]);

  const counts = new Map<string, number>();
  for (const t of recent) counts.set(dayKey(t.date), (counts.get(dayKey(t.date)) ?? 0) + 1);

  const heat: ProfileStats["heat"] = [];
  let activeDays = 0;
  for (let i = 0; i < HEAT_WEEKS * 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = dayKey(d);
    const count = counts.get(key) ?? 0;
    if (count > 0) activeDays++;
    heat.push({ key, count, future: d > today });
  }

  // Consecutive days with at least one entry, counting back from today (or yesterday if today is still empty).
  let streak = 0;
  const cursor = new Date(today);
  if (!counts.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (counts.has(dayKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { logged, accounts, streak, heat, activeDays };
});
