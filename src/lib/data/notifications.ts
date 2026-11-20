import { addDays, format, differenceInCalendarDays, startOfDay } from "date-fns";
import { getLoans } from "@/lib/data/loans";
import { getMutedPartyKeys, loanPartyKeys } from "@/lib/data/parties";
import { prisma } from "@/lib/db";
import { getBudgets } from "@/lib/data/budgets";
import { formatMoney } from "@/lib/money";
import { getUpcomingHolidays } from "@/lib/holidays";
import { ANNOUNCEMENTS } from "@/lib/changelog";
import { isBirthday } from "@/lib/age";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  read: boolean;
}

/** Reminders go out the day before something is due (and on the day itself). */
const UPCOMING_BILL_WINDOW_DAYS = 1;
const BUDGET_ALERT_THRESHOLD = 80; // percentUsed
const GOAL_MILESTONE_THRESHOLD = 90; // percent of target reached
const LOAN_REMINDER_WINDOW_DAYS = 1;

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
  prefs: {
    notifyBills: boolean;
    notifyBudgets: boolean;
    notifyGoals: boolean;
    notifyHolidays: boolean;
    notifyLoans: boolean;
  },
  /** Ids already seen via "Mark all read" — see `User.readNotificationIds`. */
  readIds: string[] = [],
  now: Date = new Date(),
  /** When this person signed up: they are not told about features that shipped before they arrived. */
  userCreatedAt?: Date,
  /** Their date of birth and first name, for the birthday wish. */
  birthday?: { dateOfBirth: Date | null; firstName: string },
): Promise<AppNotification[]> {
  const notifications: Omit<AppNotification, "read">[] = [];
  const readSet = new Set(readIds);

  // A one-time welcome greeting — not gated by any pref (it isn't an ongoing alert
  // category), always generated with the same stable id so it shows for every
  // existing user who hasn't seen it yet and for a new signup exactly once: the
  // moment it's marked read (individually or via "Mark all read"), its id lands in
  // `readNotificationIds` and it never reappears — same self-pruning mechanism
  // every other notification here already relies on, no separate "seen" flag needed.
  notifications.push({
    id: "welcome",
    title: "Welcome to Spent",
    description: "Track transactions, set budgets, and see your net worth all in one place.",
    href: "/dashboard",
    icon: "party-popper",
    color: "violet",
  });

  // On their birthday (and the next morning, so a timezone offset never skips it), once per year until read.
  if (birthday?.dateOfBirth && (isBirthday(birthday.dateOfBirth, now) || isBirthday(birthday.dateOfBirth, addDays(now, -1)))) {
    notifications.push({
      id: `birthday:${now.getFullYear()}`,
      title: `Happy birthday, ${birthday.firstName}`,
      description: "Here is to a year of calm money and goals met. Enjoy your day.",
      href: "/dashboard",
      icon: "party-popper",
      color: "violet",
    });
  }

  // Major new features (see ANNOUNCEMENTS in lib/changelog.ts): shown for three weeks to people who were
  // already here when it shipped, until read. Not gated by a preference, like the welcome note.
  for (const note of ANNOUNCEMENTS) {
    const released = new Date(`${note.date}T00:00:00`);
    const age = differenceInCalendarDays(now, released);
    if (age < 0 || age > 21) continue;
    if (userCreatedAt && userCreatedAt >= addDays(released, 1)) continue;
    notifications.push({ id: note.id, title: note.title, description: note.description, href: note.href, icon: note.icon, color: note.color });
  }

  // Major national holidays/festivals for the user's primary currency (INR/USD only —
  // see lib/holidays.ts) — purely a static calendar lookup, no DB query needed, so this
  // runs synchronously rather than joining the `tasks` array below.
  if (prefs.notifyHolidays) {
    for (const holiday of getUpcomingHolidays(currency, now)) {
      const daysUntil = differenceInCalendarDays(holiday.date, now);
      notifications.push({
        id: `holiday:${holiday.id}`,
        title: daysUntil <= 0 ? `${holiday.name} is today` : `${holiday.name} in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
        description: format(holiday.date, "EEEE, MMM d"),
        href: "/dashboard",
        icon: "party-popper",
        color: "pink",
      });
    }
  }

  const tasks: Promise<void>[] = [];

  if (prefs.notifyBills) {
    tasks.push(
      prisma.transaction
        .findMany({
          where: { userId, status: "UPCOMING", date: { gte: startOfDay(now), lte: addDays(startOfDay(now), UPCOMING_BILL_WINDOW_DAYS + 1) } },
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
      getBudgets(userId, currency).then((budgets) => {
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

  // A recurring amount that changes each time (a salary, an electricity bill) waits for the real figure.
  if (prefs.notifyBills) {
    tasks.push(
      prisma.transaction
        .findMany({
          where: { userId, status: "UPCOMING", date: { lte: now }, recurring: { amountVaries: true } },
          orderBy: { date: "desc" },
          take: 5,
          select: { id: true, title: true, type: true, amount: true, currency: true },
        })
        .then((rows) => {
          for (const tx of rows) {
            notifications.push({
              id: `confirm:${tx.id}`,
              title: `Confirm ${tx.title}`,
              description: `Enter what ${tx.type === "INCOME" ? "arrived" : "you paid"}. Usually ${formatMoney(tx.amount, tx.currency)}.`,
              href: "/transactions?status=UPCOMING",
              icon: "circle-alert",
              color: "amber",
            });
          }
        }),
    );
  }

  if (prefs.notifyLoans) {
    tasks.push(
      // No lower bound — an overdue loan (dueDate already passed) should keep
      // surfacing, unlike the bill window above which only looks forward.
      getLoans(userId).then(async (loans) => {
        const dueAll = loans
          .filter((l) => l.state.status === "OPEN" && l.state.outstanding > 0 && !!l.dueDate && l.dueDate.getTime() <= addDays(now, LOAN_REMINDER_WINDOW_DAYS).getTime())
          .slice(0, 10);
        // A chat whose reminders are muted stays quiet; the rest link straight to their chat.
        const [muted, keys] = dueAll.length > 0 ? await Promise.all([getMutedPartyKeys(userId), loanPartyKeys(userId, dueAll)]) : [new Set<string>(), new Map<string, string>()];
        const due = dueAll.filter((l) => !muted.has(keys.get(l.id) ?? ""));
        for (const loan of due) {
          // Closed (settled, waived, carried over) loans drop out above; what is owed includes any
          // interest built up so far (see lib/loan-math.ts).
          const owed = loan.state.outstanding;
          const dueDate = loan.dueDate!; // only loans with a repay-by date reach this point
          const daysUntil = differenceInCalendarDays(dueDate, now);
          const overdue = daysUntil < 0;
          const amountLabel = `${formatMoney(owed, loan.currency)}${owed !== loan.originalAmount ? " owed" : ""}`;
          notifications.push({
            id: `loan:${loan.id}`,
            title:
              loan.direction === "LENT"
                ? `${loan.title} ${overdue ? "was" : "is"} due to return your money`
                : `Repay ${loan.title}${loan.counterpartyType ? ` (${loan.counterpartyType.toLowerCase()})` : ""}`,
            description: overdue
              ? `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"} · ${amountLabel}`
              : `Due ${format(dueDate, "MMM d")} · ${amountLabel}`,
            href: keys.get(loan.id) ? `/people/${encodeURIComponent(keys.get(loan.id)!)}` : "/loans",
            icon: "handshake",
            color: overdue ? "rose" : "amber",
          });
        }
      }),
    );
  }

  await Promise.all(tasks);
  // Already-read ones are dropped: "Mark all read" clears the list, and the welcome note
  // (marked read the first time the bell opens) never comes back after a refresh.
  return notifications.filter((n) => !readSet.has(n.id)).map((n) => ({ ...n, read: false }));
}
