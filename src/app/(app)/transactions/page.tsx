import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getTransactions, getTransactionTotals, TRANSACTIONS_PAGE_SIZE } from "@/lib/data/transactions";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { getTags } from "@/lib/data/tags";
import { getRunningBalances } from "@/lib/balances";
import { TransactionsView } from "@/components/transactions/transactions-view";
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

  const categories = [...expenseCategories, ...incomeCategories];

  // Opened from a Reports category: show the drill-down header (reference screen 57).
  const drillCategory = filterState.categoryId ? categories.find((c) => c.id === filterState.categoryId) : undefined;
  const drillTotals = drillCategory ? await getTransactionTotals(userId, filters, user.currency) : null;

  return (
    <TransactionsView
      drill={
        drillCategory && drillTotals
          ? {
              categoryName: drillCategory.name,
              type,
              from: filterState.dateFrom,
              to: filterState.dateTo,
              total: drillTotals.total,
              count: drillTotals.count,
              currency: user.currency,
            }
          : null
      }
      accounts={accounts}
      categories={categories}
      tags={tags}
      currency={user.currency}
      initial={{ transactions: result.transactions, hasMore: result.hasMore }}
      initialFilterState={filterState}
      initialType={type}
      initialSearch={search}
      runningBalances={runningBalances}
    />
  );
}
