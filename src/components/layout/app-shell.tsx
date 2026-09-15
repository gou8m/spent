import type * as React from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories, getCategoryUsageCounts } from "@/lib/data/categories";
import { getCurrentUser } from "@/lib/data/user";
import { getNotifications } from "@/lib/data/notifications";

export async function AppShell({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const [user, accounts, expenseCategoriesRaw, incomeCategoriesRaw, expenseUsage, incomeUsage] = await Promise.all([
    getCurrentUser(userId).catch(() => null),
    getAccounts(userId),
    getCategories(userId, "EXPENSE"),
    getCategories(userId, "INCOME"),
    getCategoryUsageCounts(userId, "EXPENSE"),
    getCategoryUsageCounts(userId, "INCOME"),
  ]);

  if (!user) redirect("/login");

  // Feeds the transaction form's category picker "Suggested" section — frequently used
  // categories first, then the full alphabetical list, then "Custom".
  const expenseCategories = expenseCategoriesRaw.map((c) => ({ ...c, usageCount: expenseUsage[c.id] ?? 0 }));
  const incomeCategories = incomeCategoriesRaw.map((c) => ({ ...c, usageCount: incomeUsage[c.id] ?? 0 }));

  const notifications = await getNotifications(
    userId,
    user.currency,
    { notifyBills: user.notifyBills, notifyBudgets: user.notifyBudgets, notifyGoals: user.notifyGoals },
    user.readNotificationIds,
  );

  return (
    <div className="flex min-h-screen bg-bg md:gap-4">
      <Sidebar userName={user.name} userEmail={user.email} avatar={user.avatar} notifications={notifications} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader avatar={user.avatar} name={user.name} notifications={notifications} />
        <main className="flex-1 pb-24 md:pb-10">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
      <BottomNav />
      <TransactionSheet accounts={accounts} expenseCategories={expenseCategories} incomeCategories={incomeCategories} />
    </div>
  );
}
