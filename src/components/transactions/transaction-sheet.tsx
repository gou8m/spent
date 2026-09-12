"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { useTransactionSheet } from "@/stores/ui-store";
import type { AccountOption } from "@/components/transactions/account-picker";
import type { CategoryOption } from "@/components/transactions/category-picker";
import { getTransactionAction } from "@/actions/transactions";
import type { TransactionWithRelations } from "@/lib/data/transactions";

export function TransactionSheet({
  accounts,
  expenseCategories,
  incomeCategories,
}: {
  accounts: AccountOption[];
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
}) {
  const router = useRouter();
  const { isOpen, editingTransactionId, defaultType, close } = useTransactionSheet();
  const [fetched, setFetched] = useState<TransactionWithRelations | undefined>(undefined);

  useEffect(() => {
    if (!isOpen || !editingTransactionId) return;
    let cancelled = false;
    getTransactionAction(editingTransactionId).then((tx) => {
      if (!cancelled) setFetched(tx ?? undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, editingTransactionId]);

  if (accounts.length === 0) {
    return null;
  }

  const editing = editingTransactionId && fetched?.id === editingTransactionId ? fetched : undefined;
  const loading = isOpen && !!editingTransactionId && !editing;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && close()}
      title={editingTransactionId ? "Edit transaction" : "Add transaction"}
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-text-muted">Loading…</div>
      ) : (
        <TransactionForm
          accounts={accounts}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          defaultType={defaultType}
          editing={editing}
          onSaved={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </Sheet>
  );
}
