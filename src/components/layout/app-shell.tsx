import { ViewTransition, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories, getCategoryUsageCounts } from "@/lib/data/categories";
import { getCurrentUser } from "@/lib/data/user";
import { getNotifications } from "@/lib/data/notifications";
import { isUserVerified } from "@/lib/verified";

export async function AppShell({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
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
    {
      notifyBills: user.notifyBills,
      notifyBudgets: user.notifyBudgets,
      notifyGoals: user.notifyGoals,
      notifySubscriptions: user.notifySubscriptions,
    },
    user.readNotificationIds,
  );
  const isVerified = await isUserVerified(userId, user.email);

  return (
    <div className="flex min-h-screen bg-bg md:gap-4">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-text-on-accent"
      >
        Skip to main content
      </a>
      <Sidebar
        userName={user.name}
        userEmail={user.email}
        avatar={user.avatar}
        notifications={notifications}
        isVerified={isVerified}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader avatar={user.avatar} name={user.name} notifications={notifications} />
        <main id="main-content" className="flex-1 pb-24 md:pb-10">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Crossfades page content on navigation — Sidebar/BottomNav/MobileHeader
                live outside this boundary and never re-transition themselves. `share="auto"`
                + `enter="auto"` is React's built-in crossfade; `default="none"` keeps this
                from also animating on unrelated transitions (e.g. a Suspense reveal). */}
            <ViewTransition name="page-content" share="auto" enter="auto" default="none">
              {children}
            </ViewTransition>
          </div>
        </main>
      </div>
      <BottomNav />
      <TransactionSheet accounts={accounts} expenseCategories={expenseCategories} incomeCategories={incomeCategories} />
    </div>
  );
}
