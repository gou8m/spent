"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionDetails } from "@/components/transactions/transaction-details";
import { useTransactionSheet } from "@/stores/ui-store";
import type { AccountOption } from "@/components/transactions/account-picker";
import type { CategoryOption } from "@/components/transactions/category-picker";
import { getTransactionAction } from "@/actions/transactions";
import type { getOpenLoans } from "@/lib/data/loans";
import type { getTags } from "@/lib/data/tags";

const DESKTOP_QUERY = "(min-width: 1024px)";

function useIsDesktop() {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(DESKTOP_QUERY);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

export function TransactionSheet({
  accounts,
  expenseCategories,
  incomeCategories,
  openLentLoans,
  openBorrowedLoans,
  tags,
  primaryCurrency,
}: {
  accounts: AccountOption[];
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
  openLentLoans: Awaited<ReturnType<typeof getOpenLoans>>;
  openBorrowedLoans: Awaited<ReturnType<typeof getOpenLoans>>;
  tags: Awaited<ReturnType<typeof getTags>>;
  primaryCurrency: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const { isOpen, editingTransactionId, defaultType, close } = useTransactionSheet();
  // The Transactions page exposes a slot for the desktop details panel. Only read once
  // the sheet is open (never during SSR/hydration, when it is closed).
  const panelEl = isOpen && pathname === "/transactions" ? document.getElementById("tx-details-panel") : null;
  const [fetched, setFetched] = useState<Awaited<ReturnType<typeof getTransactionAction>> | undefined>(undefined);
  const [mode, setMode] = useState<"view" | "edit" | "duplicate">("view");

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
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()} title="New transaction">
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

  const isDuplicate = mode === "duplicate" && !!editing;
  const title = !editingTransactionId || isDuplicate ? "New transaction" : showDetails ? "Transaction details" : "Edit transaction";

  // On desktop the details view lives in the page panel (also while it is still loading).
  const holdForPanel = isDesktop && !!panelEl && !!editingTransactionId && mode === "view";
  const inPanel = showDetails && holdForPanel;

  return (
    <>
      {inPanel &&
        editing &&
        createPortal(
          <TransactionDetails
            variant="panel"
            transaction={editing}
            onClose={close}
            onEdit={() => setMode("edit")}
            onDuplicate={() => setMode("duplicate")}
            onDeleted={() => {
              close();
              router.refresh();
            }}
          />,
          panelEl!,
        )}
    <Sheet open={isOpen && !holdForPanel} onOpenChange={(open) => !open && close()} title={title} hideHeader={showDetails}>
      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-text-muted">Loading…</div>
      ) : showDetails && editing ? (
        <TransactionDetails
          transaction={editing}
          onEdit={() => setMode("edit")}
          onDuplicate={() => setMode("duplicate")}
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
          openLentLoans={openLentLoans}
          openBorrowedLoans={openBorrowedLoans}
          tags={tags}
          defaultType={defaultType}
          primaryCurrency={primaryCurrency}
          editing={editing}
          duplicate={isDuplicate}
          autoFocusAmount={isOpen}
          onSaved={() => {
            close();
            router.refresh();
          }}
          onDiscard={editing && !isDuplicate ? () => setMode("view") : undefined}
        />
      )}
    </Sheet>
    </>
  );
}
