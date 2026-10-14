"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarMonths, format } from "date-fns";
import { Plus, Target } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing } from "@/components/ui/progress-ring";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalDetails } from "@/components/goals/goal-details";
import { GoalForm, type EditableGoal, type AccountOption } from "@/components/goals/goal-form";
import { formatMoney } from "@/lib/money";
import type { getGoals } from "@/lib/data/goals";

type GoalRecord = Awaited<ReturnType<typeof getGoals>>[number];
type Mode = "add" | "view" | "edit";

export function GoalsView({ goals, accounts }: { goals: GoalRecord[]; accounts: AccountOption[] }) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [selected, setSelected] = useState<GoalRecord | undefined>(undefined);

  const active = goals.filter((g) => g.status === "ACTIVE");
  const completed = goals.filter((g) => g.status === "COMPLETED");
  const archived = goals.filter((g) => g.status === "ARCHIVED");

  const closest = [...active].sort((a, b) => b.percent - a.percent)[0];
  const monthsToClosest = closest?.targetDate ? Math.max(1, differenceInCalendarMonths(closest.targetDate, new Date())) : null;
  const monthlyNeeded = closest && monthsToClosest ? closest.remaining / monthsToClosest : null;

  function openAdd() {
    setSelected(undefined);
    setMode("add");
    setSheetOpen(true);
  }

  function openView(goal: GoalRecord) {
    setSelected(goal);
    setMode("view");
    setSheetOpen(true);
  }

  function close() {
    setSheetOpen(false);
    router.refresh();
  }

  const editable: EditableGoal | undefined = selected
    ? {
        id: selected.id,
        name: selected.name,
        targetAmount: selected.targetAmount,
        targetDate: selected.targetDate,
        accountId: selected.accountId,
        icon: selected.icon,
        color: selected.color,
      }
    : undefined;

  const title = mode === "add" ? "New goal" : mode === "edit" ? "Edit goal" : "Goal details";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[2rem] font-extrabold tracking-tight text-accent-text">Goals</h1>
        <button type="button" onClick={openAdd} aria-label="New goal" className="flex h-11 w-11 items-center justify-center rounded-sm bg-accent text-text-on-accent">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set a savings target and track your progress toward it." />
      ) : (
        <div className="space-y-6">
          {closest && (
            <div className="flex items-center gap-5 rounded-2xl bg-sky p-5.5">
              <ProgressRing percent={closest.percent} size={124} trackColor="#fff" fillColor="#1B4F7A">
                <span className="text-2xl font-extrabold text-sky-text">{Math.round(closest.percent)}%</span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] font-bold text-sky-text">Closest goal</p>
                <p className="mt-0.5 truncate text-xl font-extrabold tracking-tight text-sky-text">{closest.name}</p>
                <p className="mt-1 text-sm font-semibold text-sky-text">
                  {formatMoney(closest.currentAmount, closest.currency)} of {formatMoney(closest.targetAmount, closest.currency)}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-sky-text-secondary">
                  {closest.targetDate ? `Due ${format(closest.targetDate, "MMM yyyy")}` : "No deadline"}
                  {monthlyNeeded != null && ` · ${formatMoney(monthlyNeeded, closest.currency)} / month`}
                </p>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">All goals</h2>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {[...active, ...completed].map((goal) => (
                <GoalCard key={goal.id} goal={goal} onOpen={() => openView(goal)} />
              ))}
            </div>
          </div>

          {archived.length > 0 && (
            <div>
              <h2 className="text-xl font-bold tracking-tight text-text-primary">Archived</h2>
              <div className="mt-3.5 flex flex-col gap-2.5 opacity-60">
                {archived.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onOpen={() => openView(goal)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={title}>
        {mode === "view" && selected ? (
          <GoalDetails goal={selected} onEdit={() => setMode("edit")} onChanged={close} />
        ) : (
          <GoalForm
            accounts={accounts}
            editing={editable}
            onSaved={close}
            onDiscard={mode === "edit" ? () => setMode("view") : undefined}
          />
        )}
      </Sheet>
    </div>
  );
}
