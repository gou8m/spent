"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Pencil, Archive, ArchiveRestore, Trash2, PlusCircle } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ContributeDialog } from "@/components/goals/contribute-dialog";
import { setGoalStatusAction, deleteGoalAction } from "@/actions/goals";
import { formatMoney } from "@/lib/money";
import type { getGoals } from "@/lib/data/goals";

type GoalRecord = Awaited<ReturnType<typeof getGoals>>[number];

export function GoalDetails({
  goal,
  onEdit,
  onChanged,
}: {
  goal: GoalRecord;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);

  async function handleArchiveToggle() {
    setBusy(true);
    const result = await setGoalStatusAction(goal.id, goal.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED");
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(goal.status === "ARCHIVED" ? "Goal unarchived" : "Goal archived");
    onChanged();
  }

  async function handleDelete() {
    setBusy(true);
    const result = await deleteGoalAction(goal.id);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(result.archived ? "Goal archived (it has contributions)" : "Goal deleted");
    onChanged();
  }

  const rows = [
    { label: "Target", value: formatMoney(goal.targetAmount, goal.currency) },
    { label: "Remaining", value: formatMoney(goal.remaining, goal.currency) },
    ...(goal.targetDate ? [{ label: "Target date", value: format(goal.targetDate, "MMM d, yyyy") }] : []),
    ...(goal.account ? [{ label: "Linked account", value: goal.account.name }] : []),
    { label: "Status", value: goal.status === "ACTIVE" ? "Active" : goal.status === "COMPLETED" ? "Completed" : "Archived" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <IconChip icon={goal.icon} color={goal.color} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-text-primary">{goal.name}</p>
          <Amount value={goal.currentAmount} currency={goal.currency} size="md" />
        </div>
      </div>

      <div>
        <Progress value={goal.percent} tone={goal.status === "COMPLETED" ? "income" : "accent"} />
        <p className="mt-1.5 text-xs text-text-secondary">{Math.round(goal.percent)}% of {formatMoney(goal.targetAmount, goal.currency)}</p>
      </div>

      <dl className="divide-y divide-divider rounded-2xl bg-surface-2/60 px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-3">
            <dt className="text-sm text-text-secondary">{row.label}</dt>
            <dd className="text-sm font-medium text-text-primary">{row.value}</dd>
          </div>
        ))}
      </dl>

      {goal.status === "ACTIVE" && (
        <Button onClick={() => setContributeOpen(true)} className="w-full" disabled={busy}>
          <PlusCircle size={16} strokeWidth={2.25} />
          Add funds
        </Button>
      )}

      <Button onClick={onEdit} variant="outline" className="w-full" disabled={busy}>
        <Pencil size={16} strokeWidth={2.25} />
        Edit goal
      </Button>

      {confirmDelete ? (
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete} disabled={busy}>
            {busy ? "Deleting…" : "Yes, delete"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={handleArchiveToggle} disabled={busy}>
            {goal.status === "ARCHIVED" ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            {goal.status === "ARCHIVED" ? "Unarchive" : "Archive"}
          </Button>
          <Button type="button" variant="destructive" className="flex-1" onClick={() => setConfirmDelete(true)} disabled={busy}>
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      )}

      <ContributeDialog
        goalId={goal.id}
        goalName={goal.name}
        currency={goal.currency}
        open={contributeOpen}
        onOpenChange={setContributeOpen}
        onContributed={onChanged}
      />
    </div>
  );
}
