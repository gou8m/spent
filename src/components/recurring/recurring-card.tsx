"use client";

import { format, differenceInCalendarDays, startOfDay } from "date-fns";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";

import { cn } from "@/lib/utils";
import type { RecurringFrequency } from "@/lib/constants";
import type { getRecurringTransactions } from "@/lib/data/recurring";

type RecurringRecord = Awaited<ReturnType<typeof getRecurringTransactions>>[number];

const FREQUENCY_LABELS: Record<RecurringFrequency, { one: string; many: string }> = {
  DAILY: { one: "Daily", many: "days" },
  WEEKLY: { one: "Weekly", many: "weeks" },
  MONTHLY: { one: "Monthly", many: "months" },
  YEARLY: { one: "Yearly", many: "years" },
};

export function formatFrequency(frequency: string, interval: number) {
  const labels = FREQUENCY_LABELS[frequency as RecurringFrequency];
  if (!labels) return frequency;
  return interval === 1 ? labels.one : `Every ${interval} ${labels.many}`;
}

/** The small pill under a row's amount: how soon it is due —
 * amber within 3 days, green within two weeks, plain text beyond that. */
function dueBadge(rule: RecurringRecord): { label: string; className: string } {
  if (!rule.isActive) return { label: "Paused", className: "text-text-secondary" };
  const days = differenceInCalendarDays(rule.nextOccurrence, startOfDay(new Date()));
  if (days <= 3) {
    const label = days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days} days`;
    return { label, className: "rounded-full bg-warning-subtle px-2.5 py-0.5 text-warning" };
  }
  const date = format(rule.nextOccurrence, "MMM d");
  return days <= 14
    ? { label: date, className: "rounded-full bg-accent-subtle px-2.5 py-0.5 text-accent-hover" }
    : { label: date, className: "text-text-secondary" };
}

export function RecurringCard({ rule, onOpen }: { rule: RecurringRecord; onOpen: () => void }) {
  const badge = dueBadge(rule);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-[22px] bg-surface-2 px-4 py-3 text-left transition-colors hover:bg-surface-3",
        !rule.isActive && "opacity-60",
      )}
    >
      <IconChip icon={rule.category?.icon ?? "repeat"} color={rule.category?.color ?? "slate"} size="lg" flat />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-text-primary">{rule.title}</p>
        <p className="truncate text-xs text-text-secondary">
          {formatFrequency(rule.frequency, rule.interval)} · {rule.account.name}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Amount value={rule.amount} currency={rule.currency} direction={rule.type} signed className="text-base font-bold" />
        <span className={cn("text-xs font-bold", badge.className)}>{badge.label}</span>
      </div>
    </button>
  );
}
