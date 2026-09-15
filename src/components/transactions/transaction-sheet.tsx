"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionDetails } from "@/components/transactions/transaction-details";
import { useTransactionSheet } from "@/stores/ui-store";
import type { AccountOption } from "@/components/transactions/account-picker";
import type { CategoryOption } from "@/components/transactions/category-picker";
import { getTransactionAction } from "@/actions/transactions";

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
  const [fetched, setFetched] = useState<Awaited<ReturnType<typeof getTransactionAction>> | undefined>(undefined);
  const [mode, setMode] = useState<"view" | "edit">("view");

  // Reset to the details view whenever the sheet opens for a (possibly different) transaction.
  // Adjusting state during render (React's documented pattern) instead of an effect avoids an extra render pass.
  const openKey = isOpen ? (editingTransactionId ?? "new") : null;
  const [lastOpenKey, setLastOpenKey] = useState<string | null>(null);
  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    if (openKey) setMode("view");
  }

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

  // A transaction always belongs to an account — this is reachable for real after
  // "Clear all data" (which wipes every account) or restoring an empty backup, not
  // just in theory: normal signup always seeds a starting Cash account first, so a
  // brand-new user never actually hits this. Silently rendering nothing here used
  // to make "Add transaction" look broken with no explanation; show a way out instead.
  if (accounts.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()} title="Add transaction">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <p className="text-sm text-text-secondary">Add an account first — every transaction belongs to one.</p>
          <Button
            onClick={() => {
              close();
              router.push("/accounts");
            }}
          >
            Go to Accounts
          </Button>
        </div>
      </Sheet>
    );
  }

  const editing = editingTransactionId && fetched?.id === editingTransactionId ? fetched : undefined;
  const loading = isOpen && !!editingTransactionId && !editing;
  const showDetails = !!editingTransactionId && mode === "view" && !!editing;

  const title = !editingTransactionId ? "Add transaction" : showDetails ? "Transaction details" : "Edit transaction";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()} title={title}>
      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-text-muted">Loading…</div>
      ) : showDetails && editing ? (
        <TransactionDetails
          transaction={editing}
          onEdit={() => setMode("edit")}
          onDeleted={() => {
            close();
            router.refresh();
          }}
        />
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
          onDiscard={editing ? () => setMode("view") : undefined}
        />
      )}
    </Sheet>
  );
}
