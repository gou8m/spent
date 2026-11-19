import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getDashboardData } from "@/lib/data/dashboard";
import { getNotifications } from "@/lib/data/notifications";
import { NotificationBell } from "@/components/layout/notification-bell";
import { HomeMenu } from "@/components/layout/home-menu";
import { Greeting } from "@/components/dashboard/greeting";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { QuickGoals } from "@/components/dashboard/quick-goals";
import Link from "next/link";
import { Cake, ChevronRight } from "lucide-react";
import { GuideAutoOpen } from "@/components/guide/app-guide";
import { GetStartedChecklist } from "@/components/dashboard/get-started-checklist";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { UpcomingCard } from "@/components/dashboard/upcoming-card";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { TrendChart } from "@/components/dashboard/trend-chart";

export default async function DashboardPage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);
  const birthday = user.dateOfBirth ? user.dateOfBirth.toISOString().slice(5, 10) : undefined;
  const [data, notifications] = await Promise.all([
    getDashboardData(user.id, user.currency),
    getNotifications(
      user.id,
      user.currency,
      {
        notifyBills: user.notifyBills,
        notifyBudgets: user.notifyBudgets,
        notifyGoals: user.notifyGoals,
        notifySubscriptions: user.notifySubscriptions,
        notifyHolidays: user.notifyHolidays,
        notifyLoans: user.notifyLoans,
      },
      user.readNotificationIds,
    new Date(),
    user.createdAt,
    { dateOfBirth: user.dateOfBirth, firstName: user.name.split(" ")[0] },
    ).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <GuideAutoOpen createdAt={user.createdAt.toISOString()} />
      <div className="flex items-center justify-between md:min-h-14">
        {/* Mobile: the wordmark, since there's no sidebar to show it. Desktop: a
            greeting instead — the sidebar already renders "Spent." once, and the
            reference's desktop screens show a page title/greeting here instead. */}
        <span className="text-[2rem] font-extrabold tracking-tight text-accent-text md:hidden">Spent.</span>
        <div className="hidden md:block">
          <Greeting name={user.name.split(" ")[0]} currency={user.currency} birthday={birthday} />
        </div>
        <div className="flex items-center gap-3 md:hidden">
          <NotificationBell notifications={notifications} />
          <HomeMenu />
        </div>
      </div>

      {/* Mobile: the greeting sits under the wordmark (desktop shows it in the header above). */}
      <Greeting name={user.name.split(" ")[0]} currency={user.currency} birthday={birthday} className="-mt-3 text-[1.375rem] tracking-[-0.5px] md:hidden" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {!user.dateOfBirth && (
            <Link href="/profile/edit" className="flex items-center gap-3 rounded-lg bg-accent-subtle px-4 py-3.5 text-accent-hover transition-opacity hover:opacity-90">
              <Cake size={22} strokeWidth={2} className="shrink-0" />
              <span className="flex-1 text-[0.9375rem] font-bold">Add your date of birth</span>
              <ChevronRight size={18} strokeWidth={2} className="shrink-0" />
            </Link>
          )}

          <GetStartedChecklist checklist={data.checklist} />

          <BalanceCard
            balance={data.totalBalance}
            income={data.income}
            expense={data.expense}
            currency={user.currency}
            netWorth={data.netWorth}
            otherBalances={data.otherBalances}
          />

          <TrendChart data={data.trend} currency={user.currency} />

          <RecentTransactions transactions={data.recentTransactions} />

          <QuickGoals goals={data.goals} />
        </div>

        <div className="min-w-0 space-y-5">
          <UpcomingCard upcoming={data.upcoming} />
          <BudgetOverview budgets={data.budgets} currency={user.currency} />
        </div>
      </div>
    </div>
  );
}
