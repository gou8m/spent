"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** A one-question card with several answers stacked underneath. The answer given so far is highlighted. */
export function ChoiceCard({
  icon: Icon,
  title,
  hint,
  options,
  value,
  onPick,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  options: { value: string; label: string; note?: string }[];
  value?: string;
  onPick: (value: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={title} className="rounded-[22px] border border-accent-border bg-accent-subtle p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-surface text-accent-hover">
          <Icon size={20} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-extrabold leading-snug text-text-primary">{title}</p>
          {hint && <p className="mt-0.5 text-xs font-medium leading-snug text-text-secondary">{hint}</p>}
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(o.value)}
              className={cn(
                "flex min-h-11 items-center justify-between gap-3 rounded-full px-4 py-2 text-left text-[0.8125rem] font-bold transition-[transform,background-color] active:scale-[0.98]",
                on ? "bg-accent text-text-on-accent" : "bg-surface text-text-primary hover:bg-surface-2",
              )}
            >
              <span>{o.label}</span>
              {o.note && <span className={cn("text-xs font-semibold", on ? "opacity-85" : "text-text-secondary")}>{o.note}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
