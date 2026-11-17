"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SlidingTabs } from "@/components/ui/sliding-tabs";
import { FilterSheet } from "@/components/transactions/filter-sheet";
import { activeFilterCount, type FilterState } from "@/lib/transaction-filters";
import type { AccountOption } from "@/components/transactions/account-picker";

const TYPE_CHIPS = [
  { value: "all", label: "All" },
  { value: "EXPENSE", label: "Expenses" },
  { value: "INCOME", label: "Income" },
  { value: "TRANSFER", label: "Transfers" },
];

/** Search, type chips and the filter sheet. It only reports changes; the page keeps the state and fetches
 * results in place, so nothing re-renders the whole screen on the server for a filter tap. */
export function FilterBar({
  accounts,
  categories,
  tags,
  currency,
  filterState,
  type,
  search,
  onChange,
  onClear,
}: {
  accounts: AccountOption[];
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  currency: string;
  filterState: FilterState;
  type: string;
  search: string;
  onChange: (next: { filterState?: FilterState; type?: string; search?: string }) => void;
  onClear: () => void;
}) {
  const [searchText, setSearchText] = useState(search);
  const [sheetOpen, setSheetOpen] = useState(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Typing is instant; the search runs once typing pauses.
  useEffect(() => {
    if (searchText === search) return;
    const timer = setTimeout(() => onChangeRef.current({ search: searchText }), 300);
    return () => clearTimeout(timer);
  }, [searchText, search]);

  // A reset from outside (Clear filters) empties the box too.
  const [lastSearch, setLastSearch] = useState(search);
  if (search !== lastSearch) {
    setLastSearch(search);
    setSearchText(search);
  }

  const badgeCount = activeFilterCount(filterState);

  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-2.5">
        <label className="relative flex-1">
          <span className="sr-only">Search transactions</span>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search merchants, notes, amounts, dates"
            className="h-12 w-full rounded-md bg-surface-2 pl-11 pr-4 text-[0.9375rem] text-text-primary outline-none placeholder:text-text-secondary focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Filter"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-text-primary"
        >
          <SlidersHorizontal size={20} strokeWidth={2} />
          {badgeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-expense text-[0.6875rem] font-bold text-white">
              {badgeCount}
            </span>
          )}
        </button>
      </div>

      <SlidingTabs options={TYPE_CHIPS} value={type} onChange={(v) => onChange({ type: v })} />

      <FilterSheet
        key={sheetOpen ? "open" : "closed"}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        state={filterState}
        onApply={(next) => {
          setSheetOpen(false);
          onChange({ filterState: next });
        }}
        accounts={accounts}
        categories={categories}
        tags={tags}
        type={type}
        search={search}
        currency={currency}
      />

      {badgeCount > 0 && (
        <button type="button" onClick={onClear} className="text-[0.8125rem] font-bold text-accent-text">
          Clear filters
        </button>
      )}
    </div>
  );
}
