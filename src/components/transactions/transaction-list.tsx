import { isToday, isYesterday, format } from "date-fns";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionRow } from "@/components/transactions/transaction-row";
import type { TransactionWithRelations } from "@/lib/data/transactions";

function groupLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

export function TransactionList({
  transactions,
  hasFilters,
  runningBalances,
}: {
  transactions: TransactionWithRelations[];
  hasFilters: boolean;
  runningBalances?: Record<string, number>;
}) {
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
    </div>
  );
}
