import { ViewTransition, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Fab } from "@/components/layout/fab";
import { TopProgressBar } from "@/components/layout/top-progress-bar";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories, getCategoryUsageCounts } from "@/lib/data/categories";
import { getCurrentUser } from "@/lib/data/user";
import { getOpenLoans } from "@/lib/data/loans";

export async function AppShell({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [user, accounts, expenseCategoriesRaw, incomeCategoriesRaw, expenseUsage, incomeUsage, openLentLoans, openBorrowedLoans] =
    await Promise.all([
      getCurrentUser(userId).catch(() => null),
      getAccounts(userId),
      getCategories(userId, "EXPENSE"),
      getCategories(userId, "INCOME"),
      getCategoryUsageCounts(userId, "EXPENSE"),
      getCategoryUsageCounts(userId, "INCOME"),
      getOpenLoans(userId, "LENT"),
      getOpenLoans(userId, "BORROWED"),
    ]);

  if (!user) redirect("/login");

  // Feeds the transaction form's category picker — most-used-first ranking for each
  // category, both types, up front so the picker never has to re-fetch.
  const expenseCategories = expenseCategoriesRaw.map((c) => ({ ...c, usageCount: expenseUsage[c.id] ?? 0 }));
  const incomeCategories = incomeCategoriesRaw.map((c) => ({ ...c, usageCount: incomeUsage[c.id] ?? 0 }));

  return (
    <div className="flex min-h-screen bg-bg">
      <TopProgressBar />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-text-on-accent"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main-content" className="flex-1 pb-28 md:pb-10">
          <div className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-6 lg:px-10">
            {/* Crossfades page content on navigation — Sidebar/BottomNav live outside
                this boundary and never re-transition themselves. `share="auto"` +
                `enter="auto"` is React's built-in crossfade; `default="none"` keeps this
                from also animating on unrelated transitions (e.g. a Suspense reveal). */}
            <ViewTransition name="page-content" share="auto" enter="auto" default="none">
              {children}
            </ViewTransition>
          </div>
        </main>
      </div>
      <BottomNav />
      <Fab />
      <TransactionSheet
        accounts={accounts}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        openLentLoans={openLentLoans}
        openBorrowedLoans={openBorrowedLoans}
        primaryCurrency={user.currency}
      />
    </div>
  );
}
