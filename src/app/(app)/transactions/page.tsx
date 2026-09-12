import Link from "next/link";
import { requireUserId } from "@/lib/auth-helpers";
import { getTransactions } from "@/lib/data/transactions";
import { getAccounts } from "@/lib/data/accounts";
import { FilterBar } from "@/components/transactions/filter-bar";
import { TransactionList } from "@/components/transactions/transaction-list";
import { AddTransactionButton } from "@/components/transactions/add-transaction-button";

const PAGE_SIZE = 40;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  const [accounts, result] = await Promise.all([
    getAccounts(userId),
    getTransactions(userId, {
      type: params.type as "EXPENSE" | "INCOME" | "TRANSFER" | undefined,
      accountId: params.account,
      status: params.status as "COMPLETED" | "UPCOMING" | undefined,
      search: params.q,
      page: 1,
      pageSize: PAGE_SIZE * page,
    }),
  ]);

  const hasFilters = Object.entries(params).some(([k, v]) => k !== "page" && !!v);
  const loadMoreParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) if (v) loadMoreParams[k] = v;
  loadMoreParams.page = String(page + 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Transactions</h1>
        <div className="hidden sm:block">
          <AddTransactionButton />
        </div>
      </div>

      <FilterBar accounts={accounts} />

      <TransactionList transactions={result.transactions} hasFilters={hasFilters} />

      {result.hasMore && (
        <div className="flex justify-center pt-2">
          <Link
            href={`?${new URLSearchParams(loadMoreParams).toString()}`}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2"
          >
            Load more
          </Link>
        </div>
      )}
    </div>
  );
}
