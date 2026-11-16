import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { BackHeader } from "@/components/layout/back-header";
import { NotificationPrefs } from "@/components/profile/notification-prefs";

export default async function NotificationsPage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);

  return (
    <div className="max-w-2xl space-y-4">
      <BackHeader href="/profile" title="Notifications" />
      <p className="text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Notify me about</p>
      <NotificationPrefs
        notifyBills={user.notifyBills}
        notifyBudgets={user.notifyBudgets}
        notifyGoals={user.notifyGoals}
        notifySubscriptions={user.notifySubscriptions}
        notifyHolidays={user.notifyHolidays}
        notifyLoans={user.notifyLoans}
      />
    </div>
  );
}
