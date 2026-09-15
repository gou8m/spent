"use client";

import { useState } from "react";
import { isToday, isYesterday, format } from "date-fns";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { loadMoreTransactionsAction } from "@/actions/transactions";
import type { TransactionWithRelations, TransactionFilters } from "@/lib/data/transactions";

function groupLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
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
            : "Add your first transaction to start tracking where your money goes."
        }
      />
    );
  }

  const groups = new Map<string, TransactionWithRelations[]>();
  for (const tx of transactions) {
    const key = groupLabel(tx.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  return (
    <div className="space-y-5">
      {Array.from(groups.entries()).map(([label, items]) => (
        <div key={label}>
          {/* h2, not h3 — this sits directly under the page's h1 with nothing in between */}
          <h2 className="mb-1 px-2 text-[0.8125rem] font-semibold text-text-secondary">{label}</h2>
          <ul className="-mx-2">
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
