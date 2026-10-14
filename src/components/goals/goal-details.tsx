"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarMonths, format } from "date-fns";
import { toast } from "sonner";
import { Pencil, Archive, ArchiveRestore, Trash2, Plus, TrendingUp } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ContributeDialog } from "@/components/goals/contribute-dialog";
import { setGoalStatusAction, deleteGoalAction, getGoalContributionsAction } from "@/actions/goals";
import { formatMoney } from "@/lib/money";
import type { getGoals } from "@/lib/data/goals";

type GoalRecord = Awaited<ReturnType<typeof getGoals>>[number];
type Contribution = Awaited<ReturnType<typeof getGoalContributionsAction>>[number];

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
  const [contributions, setContributions] = useState<Contribution[] | null>(null);

  useEffect(() => {
    getGoalContributionsAction(goal.id).then(setContributions);
  }, [goal.id]);

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
    setConfirmDelete(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(result.archived ? "Goal archived (it has contributions)" : "Goal deleted");
    onChanged();
  }

  const monthsLeft = goal.targetDate ? Math.max(1, differenceInCalendarMonths(goal.targetDate, new Date())) : null;
  const monthlyNeeded = monthsLeft ? goal.remaining / monthsLeft : null;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-sky p-5.5 text-center">
        <ProgressRing percent={goal.percent} size={168} trackColor="#fff" fillColor="#1B4F7A" strokeWidth={16} className="mx-auto">
          <span className="text-4xl font-extrabold tracking-tight text-sky-text">{Math.round(goal.percent)}%</span>
          <span className="text-[0.8125rem] font-semibold text-sky-text-secondary">saved</span>
        </ProgressRing>
        <div className="mt-3.5 flex justify-between text-left">
          <div>
            <p className="text-xs font-semibold text-sky-text-secondary">Saved</p>
            <p className="mt-0.5 text-lg font-extrabold text-sky-text">{formatMoney(goal.currentAmount, goal.currency)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-sky-text-secondary">Target</p>
            <p className="mt-0.5 text-lg font-extrabold text-sky-text">{formatMoney(goal.targetAmount, goal.currency)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-sky-text-secondary">To go</p>
            <p className="mt-0.5 text-lg font-extrabold text-sky-text">{formatMoney(goal.remaining, goal.currency)}</p>
          </div>
        </div>
      </div>

      {goal.status === "ACTIVE" && goal.targetDate && monthlyNeeded != null && (
        <div className="flex items-center gap-3 rounded-lg bg-accent-subtle px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-accent text-text-on-accent">
            <TrendingUp size={18} strokeWidth={2} />
          </span>
          <p className="text-sm font-semibold leading-snug text-accent-hover">
            On track. {formatMoney(monthlyNeeded, goal.currency)} a month reaches your goal by {format(goal.targetDate, "MMMM yyyy")}.
          </p>
        </div>
      )}

      {goal.status === "ACTIVE" && (
        <Button onClick={() => setContributeOpen(true)} size="lg" className="w-full" disabled={busy}>
          <Plus size={18} strokeWidth={2.5} />
          Add money
        </Button>
      )}

      <div>
        <p className="text-xl font-bold tracking-tight text-text-primary">Contributions</p>
        <div className="mt-2.5 flex flex-col gap-2.5">
          {contributions === null ? (
            <p className="py-4 text-center text-sm text-text-secondary">Loading…</p>
          ) : contributions.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-secondary">No contributions yet.</p>
          ) : (
            contributions.map((c) => (
              <div key={c.id} className="flex items-center gap-3.5 rounded-lg bg-surface-2 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-surface text-accent-text">
                  <Plus size={18} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-semibold text-text-primary">{c.title}</p>
                  <p className="text-xs text-text-secondary">
                    {format(c.date, "MMM d")} · from {c.account.name}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-income">+{formatMoney(c.amount, c.currency)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button onClick={onEdit} variant="secondary" className="flex-1" disabled={busy}>
          <Pencil size={16} strokeWidth={2} />
          Edit
        </Button>
        <Button type="button" variant="secondary" className="flex-1" onClick={handleArchiveToggle} loading={busy}>
          {goal.status === "ARCHIVED" ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          {goal.status === "ARCHIVED" ? "Unarchive" : "Archive"}
        </Button>
        <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)} disabled={busy}>
          <Trash2 size={16} />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this goal?"
        description="This can't be undone. Goals with contributions are archived instead of deleted."
        confirmLabel="Delete"
        destructive
        isConfirming={busy}
        onConfirm={handleDelete}
      />

      <ContributeDialog goal={goal} open={contributeOpen} onOpenChange={setContributeOpen} onContributed={onChanged} />
    </div>
  );
}
