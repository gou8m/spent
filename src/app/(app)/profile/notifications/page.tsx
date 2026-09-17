import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { Card } from "@/components/ui/card";
import { NotificationPrefs } from "@/components/profile/notification-prefs";

export default async function NotificationsPage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Notifications</h1>

      <Card className="divide-y divide-divider p-0">
        <NotificationPrefs
          notifyBills={user.notifyBills}
          notifyBudgets={user.notifyBudgets}
          notifyGoals={user.notifyGoals}
          notifySubscriptions={user.notifySubscriptions}
          notifyHolidays={user.notifyHolidays}
          notifyLoans={user.notifyLoans}
        />
      </Card>
    </div>
  );
}
