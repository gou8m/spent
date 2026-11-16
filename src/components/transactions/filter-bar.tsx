"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { skipNextSheetRewind } from "@/hooks/use-sheet-back-button";
import { FilterSheet } from "@/components/transactions/filter-sheet";
import { activeFilterCount, type FilterState } from "@/lib/transaction-filters";
import type { AccountOption } from "@/components/transactions/account-picker";

const TYPE_CHIPS = [
  { value: "all", label: "All" },
  { value: "EXPENSE", label: "Expenses" },
  { value: "INCOME", label: "Income" },
  { value: "TRANSFER", label: "Transfers" },
];

export function FilterBar({
  accounts,
  categories,
  tags,
  currency,
}: {
  accounts: AccountOption[];
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  currency: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);

  const type = searchParams.get("type") ?? "all";
  const filterState: FilterState = {
    accountId: searchParams.get("account"),
    categoryId: searchParams.get("category"),
    tagId: searchParams.get("tag"),
    datePreset: (searchParams.get("datePreset") as FilterState["datePreset"]) ?? "all",
    dateFrom: searchParams.get("from"),
    dateTo: searchParams.get("to"),
    amountMin: searchParams.get("min") ?? "",
    amountMax: searchParams.get("max") ?? "",
  };
  const badgeCount = activeFilterCount(filterState);

  function pushParams(next: Record<string, string | null>, replace = false) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const url = `${pathname}?${params.toString()}`;
    if (replace) router.replace(url);
    else router.push(url);
  }

  function applyFilters(state: FilterState) {
    // The sheet is open, so its own history entry is the current one: swap that for the filtered
    // URL instead of pushing and then letting the sheet rewind history over the top of it.
    skipNextSheetRewind();
    pushParams({
      account: state.accountId,
      category: state.categoryId,
      tag: state.tagId,
      datePreset: state.datePreset === "all" ? null : state.datePreset,
      from: state.datePreset === "custom" ? state.dateFrom : null,
      to: state.datePreset === "custom" ? state.dateTo : null,
      min: state.amountMin || null,
      max: state.amountMax || null,
    }, true);
    setSheetOpen(false);
  }

  function clearAll() {
    setSearch("");
    router.push(pathname);
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-2.5">
        <label className="relative flex-1">
          <span className="sr-only">Search transactions</span>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              pushParams({ q: e.target.value || null }, true);
            }}
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

      <div className="flex gap-2">
        {TYPE_CHIPS.map((chip) => (
          <Chip key={chip.value} selected={type === chip.value} onClick={() => pushParams({ type: chip.value === "all" ? null : chip.value })}>
            {chip.label}
          </Chip>
        ))}
      </div>

      <FilterSheet
        key={sheetOpen ? "open" : "closed"}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        state={filterState}
        onApply={applyFilters}
        accounts={accounts}
        categories={categories}
        tags={tags}
        type={type}
        search={search}
        currency={currency}
      />

      {badgeCount > 0 && (
        <button type="button" onClick={clearAll} className="text-[0.8125rem] font-bold text-accent-text">
          Clear filters
        </button>
      )}
    </div>
  );
}
