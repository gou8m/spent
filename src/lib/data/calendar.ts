import { addDays, endOfMonth, startOfDay, startOfMonth, subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { getLoans } from "@/lib/data/loans";
import { getHolidaysInRange } from "@/lib/holidays";
import { amountOn } from "@/lib/recurrence";
import { projectOccurrences, generateDueOccurrencesThrottled } from "@/lib/recurring-generator";
import { getTransactions } from "@/lib/data/transactions";
import { getBudgets } from "@/lib/data/budgets";

/** A dated thing on the calendar that is not a transaction itself. */
export interface CalendarItem {
  id: string;
  kind: "LOAN" | "GOAL" | "BUDGET" | "HOLIDAY" | "BILL";
  /** ISO date-time; shown in the viewer's own timezone, like every other date in the app. */
  date: string;
  title: string;
  amount?: number;
  currency?: string;
  /** LOAN only. */
  direction?: "LENT" | "BORROWED";
  overdue?: boolean;
  /** HOLIDAY only: a public holiday or a festival, and whether the date may be a day off. */
  holidayKind?: "public" | "festival";
  approx?: boolean;
  /** A bill that is only a forecast from a recurring rule (it is not a transaction yet). */
  projected?: boolean;
  href?: string;
}

const MAX_MONTH_TRANSACTIONS = 1000;
const AGENDA_DAYS = 30;

/** Month number "2026-11" -> its first and last instant, widened by a day each side so the viewer's timezone cannot cut off an edge day. */
function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = startOfMonth(new Date(y, m - 1, 1));
  return { start, end: endOfMonth(start), from: subDays(start, 1), to: addDays(endOfMonth(start), 1) };
}

/** Loans due, goal dates, budget ends, holidays and forecast bills that land between two dates. */
async function collectItems(userId: string, currency: string, from: Date, to: Date): Promise<CalendarItem[]> {
  const items: CalendarItem[] = [];
  const today = startOfDay(new Date());

  const [loans, goals, budgets, rules] = await Promise.all([
    getLoans(userId),
    prisma.goal.findMany({
      where: { userId, status: "ACTIVE", targetDate: { gte: from, lte: to } },
      select: { id: true, name: true, targetDate: true, targetAmount: true, currentAmount: true },
    }),
    getBudgets(userId, currency),
    prisma.recurringTransaction.findMany({
      where: { userId, isActive: true },
      select: { id: true, title: true, amount: true, currency: true, type: true, nextOccurrence: true, startDate: true, endDate: true, frequency: true, interval: true, dayRule: true, bonusAmount: true, bonusEveryMonths: true },
    }),
  ]);

  for (const loan of loans) {
    if (loan.state.status !== "OPEN" || !loan.dueDate) continue;
    const due = new Date(loan.dueDate);
    if (due < from || due > to) continue;
    items.push({
      id: `loan:${loan.id}`,
      kind: "LOAN",
      date: due.toISOString(),
      title: loan.title,
      amount: loan.state.outstanding,
      currency: loan.currency,
      direction: loan.direction,
      overdue: startOfDay(due) < today,
      href: `/loans?loan=${loan.id}`,
    });
  }
  for (const goal of goals) {
    if (!goal.targetDate) continue;
    items.push({
      id: `goal:${goal.id}`,
      kind: "GOAL",
      date: goal.targetDate.toISOString(),
      title: goal.name,
      amount: Math.max(0, goal.targetAmount - goal.currentAmount),
      currency,
      href: "/goals",
    });
  }
  // Budgets that end on the same day (most monthly ones) become one line, not a row each.
  const endingByDay = new Map<string, { names: string[]; left: number; date: Date }>();
  for (const budget of budgets) {
    const end = new Date(budget.periodEnd);
    if (end < from || end > to) continue;
    const day = end.toISOString().slice(0, 10);
    const entry = endingByDay.get(day) ?? { names: [], left: 0, date: end };
    entry.names.push(budget.name);
    entry.left += budget.remaining;
    endingByDay.set(day, entry);
  }
  for (const [day, entry] of endingByDay) {
    items.push({
      id: `budget:${day}`,
      kind: "BUDGET",
      date: entry.date.toISOString(),
      title: entry.names.length === 1 ? `${entry.names[0]} budget ends` : `${entry.names.length} budgets end`,
      amount: entry.left,
      currency,
      href: "/budgets",
    });
  }
  for (const holiday of getHolidaysInRange(currency, from, to)) {
    items.push({ id: `holiday:${holiday.id}`, kind: "HOLIDAY", date: holiday.date.toISOString(), title: holiday.name, holidayKind: holiday.kind, approx: holiday.approx });
  }
  // Recurring rules: real UPCOMING transactions already exist for the next 30 days; beyond that,
  // forecast them from the rule so a future month is not empty.
  const horizon = addDays(today, 30);
  for (const rule of rules) {
    const dates = projectOccurrences(rule, horizon < from ? from : addDays(horizon, 1), to);
    for (const date of dates) {
      if (date < from) continue;
      items.push({
        id: `bill:${rule.id}:${date.toISOString()}`,
        kind: "BILL",
        date: date.toISOString(),
        title: rule.title,
        amount: amountOn(rule, date),
        currency: rule.currency,
        projected: true,
        href: "/recurring",
      });
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

/** Everything the calendar needs for one month: the month's transactions (all accounts; filters apply in the browser) and the dated extras. */
export async function getCalendarMonth(userId: string, currency: string, month: string) {
  const { from, to } = monthRange(month);
  await generateDueOccurrencesThrottled(userId);
  const [result, items] = await Promise.all([
    getTransactions(userId, { dateFrom: from, dateTo: to, page: 1, pageSize: MAX_MONTH_TRANSACTIONS }),
    collectItems(userId, currency, from, to),
  ]);
  return { month, currency, transactions: result.transactions, items };
}

/** The next 30 days: scheduled (upcoming) transactions plus the dated extras, soonest first. */
export async function getCalendarAgenda(userId: string, currency: string) {
  const today = startOfDay(new Date());
  const end = addDays(today, AGENDA_DAYS);
  await generateDueOccurrencesThrottled(userId);
  const [upcoming, items] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, status: "UPCOMING", date: { gte: today, lte: end } },
      select: { id: true, title: true, amount: true, currency: true, date: true, type: true },
      orderBy: { date: "asc" },
      take: 100,
    }),
    collectItems(userId, currency, today, end),
  ]);
  const bills: CalendarItem[] = upcoming.map((t) => ({
    id: `tx:${t.id}`,
    kind: "BILL",
    date: t.date.toISOString(),
    title: t.title,
    amount: t.amount,
    currency: t.currency,
  }));
  return [...bills, ...items.filter((i) => i.kind !== "BILL")].sort((a, b) => a.date.localeCompare(b.date));
}

export type CalendarMonthData = Awaited<ReturnType<typeof getCalendarMonth>>;
