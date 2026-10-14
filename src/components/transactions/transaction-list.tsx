"use client";

import { useState } from "react";
import { isToday, isYesterday, format } from "date-fns";
import { ChevronDown, Clock, Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { AddTransactionButton } from "@/components/transactions/add-transaction-button";
import { loadMoreTransactionsAction } from "@/actions/transactions";
import { formatSignedMoney } from "@/lib/money";
import type { TransactionWithRelations, TransactionFilters } from "@/lib/data/transactions";

function groupLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

/** The day's net total shown beside its label — only when every EXPENSE/INCOME
 * transaction that day shares one currency (TRANSFER rows don't contribute, they're
 * neutral); mixed-currency days show nothing rather than a misleading cross-currency sum. */
function dayNetTotal(items: TransactionWithRelations[]) {
  const contributing = items.filter((tx) => tx.type !== "TRANSFER");
  if (contributing.length === 0) return null;
  const currency = contributing[0].currency;
  if (!contributing.every((tx) => tx.currency === currency)) return null;

  const net = contributing.reduce((sum, tx) => sum + (tx.type === "EXPENSE" ? -tx.amount : tx.amount), 0);
  return formatSignedMoney(net, currency, net < 0 ? "EXPENSE" : "INCOME");
}

export function TransactionList({
  initialTransactions,
  initialHasMore,
  hasFilters,
  runningBalances,
  filters,
}: {
  initialTransactions: TransactionWithRelations[];
  initialHasMore: boolean;
  hasFilters: boolean;
  /** Covers every COMPLETED transaction for the user, not just the loaded page — computed
   * once up front so "Load more" never needs to re-fetch it. */
  runningBalances?: Record<string, number>;
  filters: TransactionFilters;
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLoadMore() {
    setIsLoading(true);
    const nextPage = page + 1;
    const result = await loadMoreTransactionsAction(filters, nextPage);
    setTransactions((prev) => [...prev, ...result.transactions]);
    setHasMore(result.hasMore);
    setPage(nextPage);
    setIsLoading(false);
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={hasFilters ? "No matching transactions" : "No transactions yet"}
        description={
          hasFilters
            ? "Try adjusting or clearing your filters."
            : "Add your first expense or income and it will show up here."
        }
        action={!hasFilters && <AddTransactionButton />}
      />
    );
  }

  // Upcoming transactions get their own collapsed batch instead of being scattered
  // inline (with a small clock badge) throughout the chronological list below — one
  // clear place to see what's due, rather than clutter mixed into transaction history.
  const upcoming = transactions.filter((tx) => tx.status === "UPCOMING");
  const completed = transactions.filter((tx) => tx.status !== "UPCOMING");

  const groups = new Map<string, TransactionWithRelations[]>();
  for (const tx of completed) {
    const key = groupLabel(tx.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  return (
    <div className="space-y-5">
      {upcoming.length > 0 && (
        <details className="group rounded-lg bg-surface-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Clock size={15} className="text-warning" />
              Upcoming ({upcoming.length})
            </span>
            <ChevronDown size={16} className="text-text-secondary transition-transform group-open:rotate-180" />
          </summary>
          <ul className="flex flex-col gap-2 border-t border-divider px-2 pb-2 pt-2">
            {upcoming.map((tx) => (
              <li key={tx.id}>
                <TransactionRow transaction={tx} runningBalance={runningBalances?.[`${tx.id}:${tx.accountId}`]} />
              </li>
            ))}
          </ul>
        </details>
      )}

      {Array.from(groups.entries()).map(([label, items]) => (
        <div key={label}>
          {/* h2, not h3 — this sits directly under the page's h1 with nothing in between */}
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">{label}</h2>
            {dayNetTotal(items) && <span className="text-[0.8125rem] font-bold text-text-secondary">{dayNetTotal(items)}</span>}
          </div>
          <ul className="flex flex-col gap-2.5">
            {items.map((tx) => (
              <li key={tx.id}>
                <TransactionRow transaction={tx} runningBalance={runningBalances?.[`${tx.id}:${tx.accountId}`]} />
              </li>
            ))}
          </ul>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="rounded-full bg-surface-2 px-5 py-2.5 text-sm font-medium text-text-secondary shadow-xs transition-colors hover:bg-surface-3 disabled:opacity-50"
          >
            {isLoading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
