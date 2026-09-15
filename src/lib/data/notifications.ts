import { addDays, format } from "date-fns";
import { prisma } from "@/lib/db";
import { getBudgets } from "@/lib/data/budgets";
import { formatMoney } from "@/lib/money";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  read: boolean;
}

const UPCOMING_BILL_WINDOW_DAYS = 7;
const BUDGET_ALERT_THRESHOLD = 80; // percentUsed
const GOAL_MILESTONE_THRESHOLD = 90; // percent of target reached

/**
 * In-app-only notifications — no email/push/SMS provider, just a live read of
 * data that already exists (upcoming bills, budget thresholds, goal
 * milestones), recomputed on every load rather than stored as rows. Each
 * category is gated by the user's own toggle in Profile.
 */
export async function getNotifications(
  userId: string,
  /** Budgets and goals don't carry their own currency — both are always in the user's
   * primary currency, same assumption `getBudgets`'s spend aggregation already makes. */
  currency: string,
  prefs: { notifyBills: boolean; notifyBudgets: boolean; notifyGoals: boolean; notifySubscriptions: boolean },
  /** Ids already seen via "Mark all read" — see `User.readNotificationIds`. */
  readIds: string[] = [],
  now: Date = new Date(),
): Promise<AppNotification[]> {
  const notifications: Omit<AppNotification, "read">[] = [];
  const readSet = new Set(readIds);

  const tasks: Promise<void>[] = [];

  if (prefs.notifyBills) {
    tasks.push(
      prisma.transaction
        .findMany({
          where: { userId, status: "UPCOMING", date: { gte: now, lte: addDays(now, UPCOMING_BILL_WINDOW_DAYS) } },
          include: { account: true },
          orderBy: { date: "asc" },
          take: 10,
        })
        .then((upcoming) => {
          for (const tx of upcoming) {
            notifications.push({
              id: `bill:${tx.id}`,
              title: `${tx.title} due ${format(tx.date, "MMM d")}`,
              description: `${formatMoney(tx.amount, tx.currency)} · ${tx.account.name}`,
              href: "/transactions?status=UPCOMING",
              icon: "calendar",
              color: "amber",
            });
          }
        }),
    );
  }

  if (prefs.notifyBudgets) {
    tasks.push(
      getBudgets(userId).then((budgets) => {
        for (const b of budgets) {
          if (b.percentUsed < BUDGET_ALERT_THRESHOLD) continue;
          const over = b.spent > b.amount;
          notifications.push({
            id: `budget:${b.id}`,
            title: over ? `"${b.name}" is over budget` : `"${b.name}" is almost spent`,
            description: `${Math.round(b.percentUsed)}% used — ${formatMoney(b.spent, currency)} of ${formatMoney(b.amount, currency)}`,
            href: "/budgets",
            icon: "calculator",
            color: over ? "rose" : "amber",
          });
        }
      }),
    );
  }

  if (prefs.notifyGoals) {
    tasks.push(
      prisma.goal.findMany({ where: { userId, status: "ACTIVE" } }).then((goals) => {
        for (const g of goals) {
          if (g.targetAmount <= 0) continue;
          const pct = (g.currentAmount / g.targetAmount) * 100;
          if (pct < GOAL_MILESTONE_THRESHOLD) continue;
          notifications.push({
            id: `goal:${g.id}`,
            title: `"${g.name}" is ${Math.round(pct)}% funded`,
            description: `${formatMoney(g.currentAmount, currency)} of ${formatMoney(g.targetAmount, currency)} target`,
            href: "/goals",
            icon: "target",
            color: "emerald",
          });
        }
      }),
    );
  }

  if (prefs.notifySubscriptions) {
    tasks.push(
      prisma.recurringTransaction.findMany({ where: { userId, isSubscription: true, isActive: true } }).then(async (subs) => {
        await Promise.all(
          subs.map(async (sub) => {
            const [latest, previous] = await prisma.transaction.findMany({
              where: { userId, recurringTransactionId: sub.id, status: "COMPLETED" },
              orderBy: [{ date: "desc" }, { createdAt: "desc" }],
              take: 2,
            });
            // Only the two most recently generated occurrences are compared — currency
            // mismatches (a rule's currency was changed) aren't a meaningful "price change".
            if (!latest || !previous || latest.currency !== previous.currency || latest.amount === previous.amount) return;
            const increased = latest.amount > previous.amount;
            notifications.push({
              id: `subscription:${sub.id}:${latest.id}`,
              title: `"${sub.title}" price ${increased ? "increased" : "decreased"}`,
              description: `${formatMoney(previous.amount, previous.currency)} → ${formatMoney(latest.amount, latest.currency)}`,
              href: "/recurring",
              icon: "trending-up",
              color: increased ? "amber" : "emerald",
            });
          }),
        );
      }),
    );
  }

  await Promise.all(tasks);
  return notifications.map((n) => ({ ...n, read: readSet.has(n.id) }));
}
