"use client";

import { useMemo, useState } from "react";
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
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  placeholder = "Choose a category",
  type = "EXPENSE",
}: {
  categories: CategoryOption[];
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder?: string;
  /** Which tab the "Custom" button opens on the Categories page. */
  type?: "EXPENSE" | "INCOME";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value);
  const sorted = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name)), [categories]);

  function goToCustomCategory() {
    setOpen(false);
    router.push(`/profile/categories?add=1&type=${type}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-full bg-surface-2 px-4.5 text-[0.9375rem] outline-none",
            "focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent-subtle",
          )}
        >
          {selected ? (
            <span className="flex items-center gap-2.5">
              <IconChip icon={selected.icon} color={selected.color} size="sm" />
              <span className="text-text-primary">{selected.name}</span>
            </span>
          ) : (
            <span className="text-text-muted">{placeholder}</span>
          )}
          <ChevronDown size={16} className="text-text-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[21rem] p-3">
        <div className="max-h-72 overflow-y-auto overscroll-contain">
          {categories.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-text-secondary">
              No categories yet — add one below.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {sorted.map((category) => (
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
              ))}
            </div>
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
