"use server";

import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getCalendarMonth } from "@/lib/data/calendar";

/** One month for the calendar (month is "yyyy-MM"). Month changes fetch just this, not the whole page. */
export async function getCalendarMonthAction(month: string) {
  const userId = await requireUserId();
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("Bad month");
  const user = await getCurrentUser(userId);
  return getCalendarMonth(userId, user.currency, month);
}
