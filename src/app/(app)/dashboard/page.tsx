import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getDashboardData } from "@/lib/data/dashboard";
import { Greeting } from "@/components/dashboard/greeting";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { UpcomingCard } from "@/components/dashboard/upcoming-card";
import { AccountsStrip } from "@/components/dashboard/accounts-strip";

export default async function DashboardPage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);
  const data = await getDashboardData(user.id, user.currency);

  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <Greeting name={firstName} />
        <p className="mt-0.5 text-sm text-text-secondary">Here&apos;s where things stand this month.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <BalanceCard
            balance={data.totalBalance}
            income={data.income}
            expense={data.expense}
            savings={data.savings}
            currency={user.currency}
            otherBalances={data.otherBalances}
          />
          <TrendChart data={data.trend} currency={user.currency} />
          <RecentTransactions transactions={data.recentTransactions} />
        </div>
        <div className="space-y-5">
          <BudgetOverview budgets={data.budgets} currency={user.currency} />
          <UpcomingCard upcoming={data.upcoming} />
          <AccountsStrip accounts={data.accounts} />
        </div>
      </div>
    </div>
  );
}
