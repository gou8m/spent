import { format } from "date-fns";
import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getAccounts } from "@/lib/data/accounts";
import { getCalendarAgenda, getCalendarMonth } from "@/lib/data/calendar";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const userId = await requireUserId();
  const user = await getCurrentUser(userId);
  const { month: requested } = await searchParams;
  const month = requested && /^\d{4}-\d{2}$/.test(requested) ? requested : format(new Date(), "yyyy-MM");

  const [data, agenda, accounts] = await Promise.all([
    getCalendarMonth(userId, user.currency, month),
    getCalendarAgenda(userId, user.currency),
    getAccounts(userId),
  ]);

  return <CalendarView initial={data} agenda={agenda} accounts={accounts.map((a) => ({ id: a.id, name: a.name, currency: a.currency }))} currency={user.currency} />;
}
