"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  /** Small grey text after the label (a parent category, a balance...). */
  hint?: string;
}

/**
 * A dropdown for long lists: shows the current choice, opens a scrollable list with a search box
 * (once there are enough options to need one) and an optional "All ..." row to clear the choice.
 * Replaces walls of chips wherever a list can grow without limit (categories, tags, accounts).
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  searchPlaceholder = "Search",
  className,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  options: SearchableOption[];
  placeholder: string;
  /** When set, a first row with this label clears the selection (value becomes null). */
  allLabel?: string;
  searchPlaceholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => (q ? options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q)) : options), [options, q]);

  function pick(next: string | null) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "pointer-events-auto flex h-13 w-full items-center justify-between gap-2 overflow-hidden rounded-md bg-surface-2 px-4.5 text-left text-[0.9375rem] outline-none focus-visible:ring-2 focus-visible:ring-accent",
            selected ? "font-semibold text-text-primary" : "text-text-secondary",
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate">{selected ? selected.label : placeholder}</span>
          {selected && allLabel ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-3"
            >
              <X size={14} />
            </span>
          ) : null}
          <ChevronDown size={16} className={cn("shrink-0 text-text-muted transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) overflow-hidden rounded-2xl p-0" sideOffset={6}>
        {options.length > 6 && (
          <label className="flex h-11 items-center gap-2 border-b border-border px-3.5 text-text-secondary">
            <Search size={16} className="shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
            />
          </label>
        )}
        <ul role="listbox" className="max-h-60 overflow-y-auto overscroll-contain p-1">
          {allLabel && !q && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={value === null}
                onClick={() => pick(null)}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm font-semibold text-text-secondary hover:bg-surface-2"
              >
                <span className="min-w-0 flex-1 truncate">{allLabel}</span>
                {value === null && <Check size={16} className="text-accent" />}
              </button>
            </li>
          )}
          {shown.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => pick(o.value)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm text-text-primary hover:bg-surface-2",
                  o.value === value && "bg-accent-subtle font-bold",
                )}
              >
                <span className="min-w-0 flex-1 truncate">
                  {o.label}
                  {o.hint && <span className="ml-1.5 text-xs font-normal text-text-secondary">{o.hint}</span>}
                </span>
                {o.value === value && <Check size={16} className="shrink-0 text-accent" />}
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="px-3 py-4 text-center text-sm text-text-secondary">Nothing matches &ldquo;{query}&rdquo;</li>}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The multi-choice twin of SearchableSelect: a dropdown of checkable rows with search, and the
 * current picks shown underneath as removable chips, so a long list never has to be laid out whole.
 */
export function SearchableMultiSelect({
  values,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search",
}: {
  values: string[];
  onChange: (values: string[]) => void;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => (q ? options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q)) : options), [options, q]);
  const picked = values.map((v) => options.find((o) => o.value === v)).filter((o): o is SearchableOption => !!o);

  function toggle(v: string) {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  }

  return (
    <div>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            className="pointer-events-auto flex h-13 w-full items-center justify-between gap-2 overflow-hidden rounded-md bg-surface-2 px-4.5 text-left text-[0.9375rem] text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="min-w-0 flex-1 truncate">{values.length ? `${values.length} selected` : placeholder}</span>
            <ChevronDown size={16} className={cn("shrink-0 text-text-muted transition-transform", open && "rotate-180")} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) overflow-hidden rounded-2xl p-0" sideOffset={6}>
          <label className="flex h-11 items-center gap-2 border-b border-border px-3.5 text-text-secondary">
            <Search size={16} className="shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
            />
          </label>
          <ul role="listbox" aria-multiselectable="true" className="max-h-60 overflow-y-auto overscroll-contain p-1">
            {shown.map((o) => {
              const on = values.includes(o.value);
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => toggle(o.value)}
                    className={cn("flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-left text-sm text-text-primary hover:bg-surface-2", on && "font-bold")}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
                        on ? "border-accent bg-accent text-text-on-accent" : "border-border-strong",
                      )}
                    >
                      {on && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {o.label}
                      {o.hint && <span className="ml-1.5 text-xs font-normal text-text-secondary">{o.hint}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && <li className="px-3 py-4 text-center text-sm text-text-secondary">Nothing matches &ldquo;{query}&rdquo;</li>}
          </ul>
        </PopoverContent>
      </Popover>
      {picked.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {picked.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              aria-label={`Remove ${o.label}`}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-accent-subtle pl-3 pr-2 text-[0.8125rem] font-bold text-accent-hover"
            >
              {o.label}
              <X size={13} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
