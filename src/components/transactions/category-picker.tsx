"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { IconChip } from "@/components/ui/icon-chip";
import { cn } from "@/lib/utils";

export interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  /** How many past transactions used this category — drives the "Suggested" section
   * below. Omitted (or 0 for every category) skips Suggested entirely. */
  usageCount?: number;
  /** Set when this is a subcategory — the "All categories" section groups by this,
   * nesting each parent's children under its name instead of one flat alphabetical
   * grid. A category referenced as someone else's parentId renders as a plain
   * (non-clickable) group header rather than a pickable tile — see `topLevel` below. */
  parentId?: string | null;
}

const MAX_SUGGESTED = 6;

export function CategoryPicker({
  categories,
  value,
  onChange,
  placeholder = "Choose a category",
  type = "EXPENSE",
  error = false,
}: {
  categories: CategoryOption[];
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder?: string;
  /** Which tab the "Custom" button opens on the Categories page. */
  type?: "EXPENSE" | "INCOME";
  /** Highlights the trigger the same way `Input`/`error` does — set when a submit
   * attempt failed because no category was chosen. */
  error?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value);
  const suggested = useMemo(
    () =>
      [...categories]
        .filter((c) => (c.usageCount ?? 0) > 0)
        .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
        .slice(0, MAX_SUGGESTED),
    [categories],
  );

  // A category that's someone else's parent becomes a group header — not pickable
  // itself, only its children are (see the "All categories" render below). The
  // suggested/selected/trigger logic above is unaffected: it just matches by id
  // against the full flat list, so a legacy transaction whose categoryId happens to
  // be a now-grouped parent (e.g. from before it had any subcategories) still shows
  // its name/icon correctly.
  const childrenByParent = useMemo(() => {
    const map = new Map<string, CategoryOption[]>();
    for (const c of categories) {
      if (!c.parentId) continue;
      if (!map.has(c.parentId)) map.set(c.parentId, []);
      map.get(c.parentId)!.push(c);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [categories]);
  // Treat "parent not present in this `categories` list" the same as "no parent" —
  // RecurringForm passes a filtered subset (only RECURRING_CATEGORY_NAMES), so a
  // leaf like "Rent" whose parent "Housing" didn't make that cut still needs to
  // render standalone here rather than silently vanishing.
  const topLevel = useMemo(
    () =>
      [...categories]
        .filter((c) => !c.parentId || !categories.some((p) => p.id === c.parentId))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  function goToCustomCategory() {
    setOpen(false);
    router.push(`/profile/categories?add=1&type=${type}`);
  }

  function renderCategory(category: CategoryOption) {
    return (
      <button
        key={category.id}
        type="button"
        onClick={() => {
          onChange(category.id);
          setOpen(false);
        }}
        className={cn(
          "flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2.5 text-center transition-colors hover:bg-surface-2",
          value === category.id && "bg-accent-subtle",
        )}
      >
        <IconChip icon={category.icon} color={category.color} size="md" />
        <span className="line-clamp-2 w-full text-[0.6875rem] font-medium leading-tight text-text-secondary">
          {category.name}
        </span>
      </button>
    );
  }

  // Consecutive standalone (childless) categories share one flowing 3-column grid,
  // same as before the hierarchy existed; a grouped parent breaks that grid and gets
  // its own labeled block with its children in their own grid underneath.
  function renderAllCategories() {
    const blocks: ReactNode[] = [];
    let standalone: CategoryOption[] = [];
    const flushStandalone = () => {
      if (standalone.length === 0) return;
      blocks.push(
        <div key={`standalone-${blocks.length}`} className="grid grid-cols-3 gap-1.5">
          {standalone.map(renderCategory)}
        </div>,
      );
      standalone = [];
    };

    for (const category of topLevel) {
      const children = childrenByParent.get(category.id);
      if (!children || children.length === 0) {
        standalone.push(category);
        continue;
      }
      flushStandalone();
      blocks.push(
        <div key={category.id}>
          <p className="mb-1.5 px-1 text-xs font-medium text-text-muted">{category.name}</p>
          <div className="grid grid-cols-3 gap-1.5">{children.map(renderCategory)}</div>
        </div>,
      );
    }
    flushStandalone();
    return blocks;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 overflow-hidden rounded-full bg-surface-2 px-4.5 text-[0.9375rem] outline-none",
            "focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent-subtle",
            error && "ring-2 ring-error/40",
          )}
        >
          {selected ? (
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <IconChip icon={selected.icon} color={selected.color} size="sm" />
              <span className="truncate text-text-primary">{selected.name}</span>
            </span>
          ) : (
            <span className="text-text-muted">{placeholder}</span>
          )}
          <ChevronDown size={16} className="shrink-0 text-text-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[21rem] p-3">
        <div className="max-h-72 overflow-y-auto overscroll-contain">
          {categories.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-text-secondary">
              No categories yet — add one below.
            </p>
          ) : (
            <>
              {suggested.length > 0 && (
                <>
                  <p className="mb-1.5 px-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">Suggested</p>
                  <div className="grid grid-cols-3 gap-1.5">{suggested.map(renderCategory)}</div>
                  <div className="my-2.5 h-px bg-divider" />
                  <p className="mb-1.5 px-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">All categories</p>
                </>
              )}
              <div className="space-y-2.5">{renderAllCategories()}</div>
            </>
          )}

          <div className="my-2 h-px bg-divider" />

          <button
            type="button"
            onClick={goToCustomCategory}
            className="flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2.5 text-left text-sm font-medium text-accent-text transition-colors hover:bg-surface-2"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-subtle">
              <Plus size={15} />
            </span>
            Custom
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
