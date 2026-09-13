"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalDetails } from "@/components/goals/goal-details";
import { GoalForm, type EditableGoal, type AccountOption } from "@/components/goals/goal-form";
import type { getGoals } from "@/lib/data/goals";

type GoalRecord = Awaited<ReturnType<typeof getGoals>>[number];
type Mode = "add" | "view" | "edit";

export function GoalsView({ goals, accounts }: { goals: GoalRecord[]; accounts: AccountOption[] }) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [selected, setSelected] = useState<GoalRecord | undefined>(undefined);

  const active = goals.filter((g) => g.status !== "ARCHIVED");
  const archived = goals.filter((g) => g.status === "ARCHIVED");

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

  const title = mode === "add" ? "Add goal" : mode === "edit" ? "Edit goal" : "Goal details";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Goals</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus size={16} strokeWidth={2.5} />
          Add goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set a savings target and track your progress toward it." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {active.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onOpen={() => openView(goal)} />
            ))}
          </div>

          {archived.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-text-secondary">Archived</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
