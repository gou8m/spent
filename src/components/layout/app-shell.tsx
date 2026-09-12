import type * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";

export async function AppShell({
  userId,
  userName,
  userEmail,
  children,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const [accounts, expenseCategories, incomeCategories] = await Promise.all([
    getAccounts(userId),
    getCategories(userId, "EXPENSE"),
    getCategories(userId, "INCOME"),
  ]);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar userName={userName} userEmail={userEmail} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 pb-24 md:pb-10">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
      <BottomNav />
      <TransactionSheet accounts={accounts} expenseCategories={expenseCategories} incomeCategories={incomeCategories} />
    </div>
  );
}
