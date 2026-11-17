"use client";

import { useRef, useState } from "react";
import { FilterBar } from "@/components/transactions/filter-bar";
import { TransactionList } from "@/components/transactions/transaction-list";
import { loadMoreTransactionsAction } from "@/actions/transactions";
import { EMPTY_FILTER_STATE, activeFilterCount, filtersToParams, toBaseFilters, type FilterState } from "@/lib/transaction-filters";
import type { AccountOption } from "@/components/transactions/account-picker";
import type { TransactionWithRelations } from "@/lib/data/transactions";

interface Initial {
  transactions: TransactionWithRelations[];
  hasMore: boolean;
}

/**
 * The search box, filters and list on the Transactions page. Filter taps fetch the new page of results
 * through one small server call and swap the list in place (the old rows stay, dimmed, until the new
 * ones arrive), and the address bar is kept in step without a full page navigation. Only the first load,
 * and a refresh after saving a transaction, render the whole page on the server.
 */
export function TransactionsBrowser({
  accounts,
  categories,
  tags,
  currency,
  initial,
  initialFilterState,
  initialType,
  initialSearch,
  runningBalances,
  onFiltersChanged,
}: {
  accounts: AccountOption[];
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  currency: string;
  initial: Initial;
  initialFilterState: FilterState;
  initialType: string;
  initialSearch: string;
  runningBalances: Record<string, number>;
  /** Called once the person changes any filter, so a stale "drill-down" header can be dropped. */
  onFiltersChanged?: () => void;
}) {
  const [filterState, setFilterState] = useState(initialFilterState);
  const [type, setType] = useState(initialType);
  const [search, setSearch] = useState(initialSearch);
  const [items, setItems] = useState(initial.transactions);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestId = useRef(0);

  // After the server renders again (a transaction was saved or deleted) take its fresh first page.
  const [seenInitial, setSeenInitial] = useState(initial);
  if (initial !== seenInitial) {
    setSeenInitial(initial);
    setItems(initial.transactions);
    setHasMore(initial.hasMore);
    setPage(1);
  }

  function filtersFor(state: FilterState, nextType: string, nextSearch: string) {
    return toBaseFilters(state, nextType, nextSearch, currency);
  }

  async function run(state: FilterState, nextType: string, nextSearch: string) {
    const id = ++requestId.current;
    setRefreshing(true);
    // Keep the address in step (so refresh / back / share work) without asking the server to render the page.
    const query = filtersToParams(state, nextType, nextSearch).toString();
    window.history.replaceState(window.history.state, "", query ? `?${query}` : window.location.pathname);
    try {
      const result = await loadMoreTransactionsAction(filtersFor(state, nextType, nextSearch), 1);
      if (id !== requestId.current) return; // a newer tap already took over
      setItems(result.transactions);
      setHasMore(result.hasMore);
      setPage(1);
    } finally {
      if (id === requestId.current) setRefreshing(false);
    }
  }

  function change(next: { filterState?: FilterState; type?: string; search?: string }) {
    const state = next.filterState ?? filterState;
    const nextType = next.type ?? type;
    const nextSearch = next.search ?? search;
    if (next.filterState) setFilterState(state);
    if (next.type !== undefined) setType(nextType);
    if (next.search !== undefined) setSearch(nextSearch);
    onFiltersChanged?.();
    void run(state, nextType, nextSearch);
  }

  function clearAll() {
    setFilterState(EMPTY_FILTER_STATE);
    setType("all");
    setSearch("");
    onFiltersChanged?.();
    void run(EMPTY_FILTER_STATE, "all", "");
  }

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    const next = page + 1;
    try {
      const result = await loadMoreTransactionsAction(filtersFor(filterState, type, search), next);
      setItems((prev) => [...prev, ...result.transactions.filter((t) => !prev.some((p) => p.id === t.id))]);
      setHasMore(result.hasMore);
      setPage(next);
    } finally {
      setLoadingMore(false);
    }
  }

  const hasFilters = activeFilterCount(filterState) > 0 || type !== "all" || search.trim() !== "";

  return (
    <>
      <FilterBar
        accounts={accounts}
        categories={categories}
        tags={tags}
        currency={currency}
        filterState={filterState}
        type={type}
        search={search}
        onChange={change}
        onClear={clearAll}
      />
      <TransactionList
        transactions={items}
        hasMore={hasMore}
        loadingMore={loadingMore}
        refreshing={refreshing}
        onLoadMore={loadMore}
        hasFilters={hasFilters}
        runningBalances={runningBalances}
      />
    </>
  );
}
