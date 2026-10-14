"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { countFilteredTransactionsAction } from "@/actions/transactions";
import { EMPTY_FILTER_STATE, toBaseFilters, type FilterState } from "@/lib/transaction-filters";
import type { AccountOption } from "@/components/transactions/account-picker";

export function FilterSheet({
  open,
  onOpenChange,
  state,
  onApply,
  accounts,
  categories,
  tags,
  type,
  search,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: FilterState;
  onApply: (state: FilterState) => void;
  accounts: AccountOption[];
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  type: string;
  search: string;
  currency: string;
}) {
  // No reset-on-open effect: the parent remounts this component (via a `key` that
  // flips each time the sheet opens), so `useState(state)` below is naturally
  // re-evaluated fresh against the latest applied filters every time it opens.
  const [draft, setDraft] = useState(state);
  const [resultCount, setResultCount] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(async () => {
      const count = await countFilteredTransactionsAction(toBaseFilters(draft, type, search, currency));
      setResultCount(count);
    }, 250);
    return () => clearTimeout(timeout);
  }, [draft, open, type, search, currency]);

  function patch(partial: Partial<FilterState>) {
    setDraft((d) => ({ ...d, ...partial }));
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      footer={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDraft(EMPTY_FILTER_STATE)}
            className="h-13 shrink-0 px-2 text-sm font-bold text-accent-text"
          >
            Clear
          </button>
          <Button className="flex-1" size="lg" onClick={() => onApply(draft)}>
            Show {resultCount ?? "…"} results
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Date</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["this-month", "This month"],
                ["last-30", "Last 30 days"],
                ["last-month", "Last month"],
                ["custom", "Custom"],
              ] as const
            ).map(([value, label]) => (
              <Chip key={value} selected={draft.datePreset === value} onClick={() => patch({ datePreset: draft.datePreset === value ? "all" : value })}>
                {label}
              </Chip>
            ))}
          </div>
          {draft.datePreset === "custom" && (
            <div className="mt-3 flex gap-3">
              <DatePicker value={draft.dateFrom ?? ""} onChange={(v) => patch({ dateFrom: v })} />
              <DatePicker value={draft.dateTo ?? ""} onChange={(v) => patch({ dateTo: v })} />
            </div>
          )}
        </div>

        {accounts.length > 0 && (
          <div>
            <p className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Account</p>
            <div className="flex flex-wrap gap-2">
              {accounts.map((a) => (
                <Chip key={a.id} selected={draft.accountId === a.id} onClick={() => patch({ accountId: draft.accountId === a.id ? null : a.id })}>
                  {a.name}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div>
            <p className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Chip key={c.id} selected={draft.categoryId === c.id} onClick={() => patch({ categoryId: draft.categoryId === c.id ? null : c.id })}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div>
            <p className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Tag</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Chip key={t.id} selected={draft.tagId === t.id} onClick={() => patch({ tagId: draft.tagId === t.id ? null : t.id })}>
                  {t.name}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Amount</p>
          <div className="flex items-center gap-2.5">
            <input
              value={draft.amountMin}
              onChange={(e) => patch({ amountMin: e.target.value })}
              inputMode="decimal"
              placeholder="Min"
              className="h-13 w-full min-w-0 rounded-md bg-surface-2 px-4 text-[0.9375rem] font-semibold text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <span className="h-0.5 w-3 shrink-0 bg-border-strong" />
            <input
              value={draft.amountMax}
              onChange={(e) => patch({ amountMax: e.target.value })}
              inputMode="decimal"
              placeholder="Max"
              className="h-13 w-full min-w-0 rounded-md bg-surface-2 px-4 text-[0.9375rem] font-semibold text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
        </div>
      </div>
    </Sheet>
  );
}
