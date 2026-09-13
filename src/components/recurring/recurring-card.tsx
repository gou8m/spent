"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Pause, Play, Trash2, Repeat } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { setRecurringActiveAction, deleteRecurringAction } from "@/actions/recurring";
import type { RecurringFrequency } from "@/lib/constants";
import type { getRecurringTransactions } from "@/lib/data/recurring";

type RecurringRecord = Awaited<ReturnType<typeof getRecurringTransactions>>[number];

const FREQUENCY_LABELS: Record<RecurringFrequency, { one: string; many: string }> = {
  DAILY: { one: "Daily", many: "days" },
  WEEKLY: { one: "Weekly", many: "weeks" },
  MONTHLY: { one: "Monthly", many: "months" },
  YEARLY: { one: "Yearly", many: "years" },
};

function formatFrequency(frequency: string, interval: number) {
  const labels = FREQUENCY_LABELS[frequency as RecurringFrequency];
  if (!labels) return frequency;
  return interval === 1 ? labels.one : `Every ${interval} ${labels.many}`;
}

export function RecurringCard({ rule, onEdit }: { rule: RecurringRecord; onEdit: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleToggleActive() {
    setBusy(true);
    const result = await setRecurringActiveAction(rule.id, !rule.isActive);
    setBusy(false);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${rule.title}"? This can't be undone.`)) return;
    setBusy(true);
    const result = await deleteRecurringAction(rule.id);
    setBusy(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.paused ? "Already used — paused instead" : "Recurring transaction deleted");
      router.refresh();
    }
  }

  return (
    <div className={`flex items-center gap-3 rounded-3xl bg-surface p-4 shadow-sm ${!rule.isActive ? "opacity-60" : ""}`}>
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" disabled={busy} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-2 hover:text-text-primary">
            <MoreHorizontal size={17} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil size={14} /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleActive}>
            {rule.isActive ? <Pause size={14} /> : <Play size={14} />}
            {rule.isActive ? "Pause" : "Resume"}
          </DropdownMenuItem>
          <DropdownMenuItem destructive onClick={handleDelete}>
            <Trash2 size={14} /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
