"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
}: {
  categories: CategoryOption[];
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value);

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
        {categories.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-text-secondary">
            No categories yet — add one in Profile.
          </p>
        ) : (
          <div className="grid max-h-72 grid-cols-3 gap-1.5 overflow-y-auto overscroll-contain">
            {categories.map((category) => (
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
      </PopoverContent>
    </Popover>
  );
}
