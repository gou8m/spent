import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getDashboardData } from "@/lib/data/dashboard";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Greeting } from "@/components/dashboard/greeting";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { QuickGoals } from "@/components/dashboard/quick-goals";
import { GetStartedChecklist } from "@/components/dashboard/get-started-checklist";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { UpcomingCard } from "@/components/dashboard/upcoming-card";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { TrendChart } from "@/components/dashboard/trend-chart";

export default async function DashboardPage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);
  const data = await getDashboardData(user.id, user.currency);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {/* Mobile: the wordmark, since there's no sidebar to show it. Desktop: a
            greeting instead — the sidebar already renders "Spent." once, and the
            reference's desktop screens show a page title/greeting here instead. */}
        <span className="text-[2rem] font-extrabold tracking-tight text-accent-text md:hidden">Spent.</span>
        <div className="hidden md:block">
          <Greeting name={user.name.split(" ")[0]} />
        </div>
        <Link href="/profile" aria-label="Profile">
          <UserAvatar avatar={user.avatar} name={user.name} />
        </Link>
      </div>

      <GetStartedChecklist checklist={data.checklist} />

      <BalanceCard
        balance={data.totalBalance}
        income={data.income}
        expense={data.expense}
        currency={user.currency}
        netWorth={data.netWorth}
        otherBalances={data.otherBalances}
      />

      <QuickGoals goals={data.goals} />

      <RecentTransactions transactions={data.recentTransactions} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <UpcomingCard upcoming={data.upcoming} />
        <BudgetOverview budgets={data.budgets} currency={user.currency} />
        <TrendChart data={data.trend} currency={user.currency} />
      </div>
    </div>
  );
}
