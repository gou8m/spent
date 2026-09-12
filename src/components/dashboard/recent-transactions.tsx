import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionRow } from "@/components/transactions/transaction-row";
import type { TransactionWithRelations } from "@/lib/data/transactions";

export function RecentTransactions({ transactions }: { transactions: TransactionWithRelations[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
        <Link href="/transactions" className="text-sm font-medium text-accent-text hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="pt-2">
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Add your first transaction to start tracking where your money goes."
          />
        ) : (
          <ul className="-mx-2">
            {transactions.map((tx) => (
              <li key={tx.id}>
                <TransactionRow transaction={tx} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
