"use client";

import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pieces of the add-transaction sheet. The sheet shows only what an ordinary entry needs; everything
 * else is a chip that opens a small card, or a one-question prompt that appears only when it matters.
 */

/** A question with two answers, side by side and the same size. */
export function PromptCard({
  icon: Icon,
  title,
  hint,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  error,
  tone = "amber",
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  error?: string;
  tone?: "amber" | "green";
}) {
  return (
    <div
      role="group"
      aria-label={title}
      className={cn(
        "rounded-[22px] border p-4",
        error ? "border-error bg-error-subtle" : tone === "amber" ? "border-warning/30 bg-warning-subtle" : "border-accent-border bg-accent-subtle",
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-surface", tone === "amber" ? "text-warning" : "text-accent-hover")}>
          <Icon size={20} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-extrabold leading-snug text-text-primary">{title}</p>
          <p className="mt-0.5 text-xs font-medium leading-snug text-text-secondary">{hint}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <button type="button" onClick={onPrimary} className="h-11 rounded-full bg-accent px-3 text-[0.8125rem] font-bold text-text-on-accent transition-transform active:scale-[0.97]">
          {primaryLabel}
        </button>
        <button type="button" onClick={onSecondary} className="h-11 rounded-full bg-surface px-3 text-[0.8125rem] font-bold text-text-primary transition-transform active:scale-[0.97]">
          {secondaryLabel}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-bold text-error">{error}</p>}
    </div>
  );
}

/** The row of optional details (Note, Repeat, Loan, Goal): equal-width, so the row is always balanced. */
export function DetailChips({ children, count }: { children: React.ReactNode; count: number }) {
  return (
    <div>
      <p className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">More details</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, count)}, minmax(0, 1fr))` }}>
        {children}
      </div>
    </div>
  );
}

export function DetailChip({ icon: Icon, label, active, onClick }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-full border-2 px-2 text-[0.8125rem] transition-[background-color,border-color,transform] active:scale-[0.97]",
        active ? "border-accent bg-accent-subtle font-bold text-accent-hover" : "border-transparent bg-surface-2 font-semibold text-text-primary",
      )}
    >
      <Icon size={16} strokeWidth={2.25} className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

/** A detail that has been switched on: a small card with its own fields and a way to remove it. */
export function DetailCard({
  icon: Icon,
  title,
  hint,
  onRemove,
  removeLabel = "Remove",
  children,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  onRemove?: () => void;
  removeLabel?: string;
  children?: React.ReactNode;
  tone?: "neutral" | "green";
}) {
  return (
    <div className={cn("animate-fade-in rounded-[22px] p-4", tone === "green" ? "bg-accent-subtle" : "bg-surface-2")}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-surface text-accent-hover">
          <Icon size={20} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-extrabold leading-snug text-text-primary">{title}</p>
          {hint && <p className="mt-0.5 text-xs font-medium leading-snug text-text-secondary">{hint}</p>}
        </div>
        {onRemove && (
          <button type="button" aria-label={removeLabel} onClick={onRemove} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary transition-colors hover:bg-surface-3">
            <X size={16} strokeWidth={2.25} />
          </button>
        )}
      </div>
      {children && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}
