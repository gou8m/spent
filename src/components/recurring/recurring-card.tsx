"use client";

import { format } from "date-fns";
import { Repeat } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { Badge } from "@/components/ui/badge";
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

export function RecurringCard({ rule, onOpen }: { rule: RecurringRecord; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-3 rounded-3xl bg-surface p-4 text-left shadow-sm transition-colors hover:bg-surface-2 ${!rule.isActive ? "opacity-60" : ""}`}
    >
      <IconChip icon={rule.category?.icon ?? "repeat"} color={rule.category?.color ?? "slate"} size="lg" />
      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-text-primary">{rule.title}</p>
          {rule.isSubscription && (
            <Badge tone="accent" className="shrink-0">
              <Repeat size={11} strokeWidth={2.5} />
              Subscription
            </Badge>
          )}
        </span>
        <p className="truncate text-xs text-text-muted">
          {formatFrequency(rule.frequency, rule.interval)} · {rule.account.name}
          {!rule.isActive ? " · Paused" : ` · Next ${format(rule.nextOccurrence, "MMM d")}`}
        </p>
      </div>
      <Amount value={rule.amount} currency={rule.currency} direction={rule.type} signed size="md" />
    </button>
  );
}
