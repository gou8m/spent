import Link from "next/link";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionRow } from "@/components/transactions/transaction-row";
import type { TransactionWithRelations } from "@/lib/data/transactions";

export function RecentTransactions({ transactions }: { transactions: TransactionWithRelations[] }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[1.375rem] font-bold tracking-tight text-text-primary">Recent Transactions</h2>
        {transactions.length > 0 && (
          <Link href="/transactions" className="text-[0.8125rem] font-bold text-accent-text">
            See all
          </Link>
        )}
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Add your first expense or income and it will show up here."
          className="mt-2"
        />
      ) : (
        <ul className="mt-3.5 flex flex-col gap-2.5">
          {transactions.map((tx) => (
            <li key={tx.id}>
              <TransactionRow transaction={tx} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
