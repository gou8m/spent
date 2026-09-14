"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil, Pause, Play, Trash2, Repeat } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setRecurringActiveAction, deleteRecurringAction } from "@/actions/recurring";
import { formatFrequency } from "@/components/recurring/recurring-card";
import type { getRecurringTransactions } from "@/lib/data/recurring";

type RecurringRecord = Awaited<ReturnType<typeof getRecurringTransactions>>[number];

export function RecurringDetails({
  rule,
  onEdit,
  onChanged,
}: {
  rule: RecurringRecord;
  onEdit: () => void;
  /** Called after a pause/resume/delete succeeds — the parent closes the sheet and refreshes. */
  onChanged: () => void;
}) {
  const [confirmAction, setConfirmAction] = useState<"pause" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);

  async function handlePause() {
    setBusy(true);
    const result = await setRecurringActiveAction(rule.id, false);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Paused");
    onChanged();
  }

  async function handleResume() {
    setBusy(true);
    const result = await setRecurringActiveAction(rule.id, true);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Resumed");
    onChanged();
  }

  async function handleDelete() {
    setBusy(true);
    const result = await deleteRecurringAction(rule.id);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(result.paused ? "Already used — paused instead" : "Recurring transaction deleted");
    onChanged();
  }

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Frequency", value: formatFrequency(rule.frequency, rule.interval) },
    { label: "Account", value: rule.account.name },
    { label: "Category", value: rule.category?.name ?? "Uncategorized" },
    { label: "Started", value: format(rule.startDate, "MMM d, yyyy") },
    ...(rule.endDate ? [{ label: "Ends", value: format(rule.endDate, "MMM d, yyyy") }] : []),
    {
      label: rule.isActive ? "Next occurrence" : "Status",
      value: rule.isActive ? format(rule.nextOccurrence, "MMM d, yyyy") : "Paused",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <IconChip icon={rule.category?.icon ?? "repeat"} color={rule.category?.color ?? "slate"} size="lg" />
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <p className="truncate text-lg font-semibold text-text-primary">{rule.title}</p>
            {rule.isSubscription && (
              <Badge tone="accent" className="shrink-0">
                <Repeat size={11} strokeWidth={2.5} />
                Subscription
              </Badge>
            )}
          </span>
          <Amount value={rule.amount} currency={rule.currency} direction={rule.type} signed size="md" />
        </div>
      </div>

      <dl className="divide-y divide-divider rounded-2xl bg-surface-2/60 px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-3">
            <dt className="text-sm text-text-secondary">{row.label}</dt>
            <dd className="truncate text-sm font-medium text-text-primary">{row.value}</dd>
          </div>
        ))}
      </dl>

      {confirmAction ? (
        <div className="space-y-2">
          <p className="text-center text-sm text-text-secondary">
            {confirmAction === "delete" ? `Delete "${rule.title}"? This can't be undone.` : `Pause "${rule.title}"?`}
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmAction(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirmAction === "delete" ? "destructive" : "primary"}
              className="flex-1"
              onClick={confirmAction === "delete" ? handleDelete : handlePause}
              disabled={busy}
            >
              {busy ? "…" : confirmAction === "delete" ? "Yes, delete" : "Yes, pause"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Button onClick={onEdit} className="w-full">
            <Pencil size={16} strokeWidth={2.25} />
            Edit
          </Button>
          <div className="flex items-center gap-3">
            {rule.isActive ? (
              <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmAction("pause")} disabled={busy}>
                <Pause size={16} strokeWidth={2.25} />
                Pause
              </Button>
            ) : (
              <Button type="button" variant="outline" className="flex-1" onClick={handleResume} disabled={busy}>
                <Play size={16} strokeWidth={2.25} />
                Resume
              </Button>
            )}
            <Button type="button" variant="destructive" className="flex-1" onClick={() => setConfirmAction("delete")} disabled={busy}>
              <Trash2 size={16} strokeWidth={2.25} />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
