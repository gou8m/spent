import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getTransactions, TRANSACTIONS_PAGE_SIZE } from "@/lib/data/transactions";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { getTags } from "@/lib/data/tags";
import { getRunningBalances } from "@/lib/balances";
import { BackHeader } from "@/components/layout/back-header";
import { FilterBar } from "@/components/transactions/filter-bar";
import { TransactionList } from "@/components/transactions/transaction-list";
import { toBaseFilters, type FilterState } from "@/lib/transaction-filters";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await requireUserId();
  const user = await getCurrentUser(userId);
  const params = await searchParams;

  const filterState: FilterState = {
    accountId: params.account ?? null,
    categoryId: params.category ?? null,
    tagId: params.tag ?? null,
    datePreset: (params.datePreset as FilterState["datePreset"]) ?? "all",
    dateFrom: params.from ?? null,
    dateTo: params.to ?? null,
    amountMin: params.min ?? "",
    amountMax: params.max ?? "",
  };
  const type = params.type ?? "all";
  const search = params.q ?? "";
  const filters = toBaseFilters(filterState, type, search, user.currency);

  const [accounts, expenseCategories, incomeCategories, tags, result, runningBalances] = await Promise.all([
    getAccounts(userId),
    getCategories(userId, "EXPENSE"),
    getCategories(userId, "INCOME"),
    getTags(userId),
    getTransactions(userId, { ...filters, page: 1, pageSize: TRANSACTIONS_PAGE_SIZE }),
    getRunningBalances(userId),
  ]);

  const hasFilters = Object.values(filters).some((v) => v !== undefined);
  const categories = [...expenseCategories, ...incomeCategories];

  return (
    <div className="space-y-4">
      <BackHeader href="/dashboard" title="Transactions" />

      <FilterBar accounts={accounts} categories={categories} tags={tags} currency={user.currency} />

      {/* Keyed by the active filters so picking a different filter remounts the list
          with a fresh accumulator instead of appending onto stale pages. */}
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
