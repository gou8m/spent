import { requireUserId } from "@/lib/auth-helpers";
import { getTransactions, TRANSACTIONS_PAGE_SIZE, type TransactionFilters } from "@/lib/data/transactions";
import { getAccounts } from "@/lib/data/accounts";
import { getRunningBalances } from "@/lib/balances";
import { FilterBar } from "@/components/transactions/filter-bar";
import { TransactionList } from "@/components/transactions/transaction-list";
import { AddTransactionButton } from "@/components/transactions/add-transaction-button";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;

  const filters: TransactionFilters = {
    type: params.type as "EXPENSE" | "INCOME" | "TRANSFER" | undefined,
    accountId: params.account,
    status: params.status as "COMPLETED" | "UPCOMING" | undefined,
    search: params.q,
  };

  const [accounts, result, runningBalances] = await Promise.all([
    getAccounts(userId),
    getTransactions(userId, { ...filters, page: 1, pageSize: TRANSACTIONS_PAGE_SIZE }),
    getRunningBalances(userId),
  ]);

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Transactions</h1>
        <div className="hidden sm:block">
          <AddTransactionButton />
        </div>
      </div>

      <FilterBar accounts={accounts} />

      {/* Keyed by the active filters so picking a different account/type/status remounts
          the list with a fresh accumulator instead of appending onto stale pages. */}
      <TransactionList
        key={JSON.stringify(filters)}
        initialTransactions={result.transactions}
        initialHasMore={result.hasMore}
        hasFilters={hasFilters}
        runningBalances={runningBalances}
        filters={filters}
      />
    </div>
  );
}
