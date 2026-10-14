import { Check } from "lucide-react";
import { format } from "date-fns";
import { IconChip } from "@/components/ui/icon-chip";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/money";
import type { getGoals } from "@/lib/data/goals";

type GoalRecord = Awaited<ReturnType<typeof getGoals>>[number];

export function GoalCard({ goal, onOpen }: { goal: GoalRecord; onOpen: () => void }) {
  if (goal.status === "COMPLETED") {
    return (
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-lg bg-accent-subtle p-4 text-left">
        <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-md bg-accent text-text-on-accent">
          <Check size={22} strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-text-primary">{goal.name}</p>
          <p className="text-[0.8125rem] font-semibold text-accent-hover">Completed · {formatMoney(goal.currentAmount, goal.currency)}</p>
        </div>
      </button>
    );
  }

  return (
    <button type="button" onClick={onOpen} className="w-full rounded-lg bg-surface-2 p-4 text-left">
      <div className="flex items-center gap-3">
        <IconChip icon={goal.icon} color={goal.color} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-text-primary">{goal.name}</p>
          <p className="text-xs text-text-secondary">{goal.targetDate ? `Due ${format(goal.targetDate, "MMM yyyy")}` : "No deadline"}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[0.9375rem] font-bold text-text-primary">{formatMoney(goal.currentAmount, goal.currency)}</p>
          <p className="text-xs text-text-secondary">of {formatMoney(goal.targetAmount, goal.currency)}</p>
        </div>
      </div>
      <Progress value={goal.percent} tone="accent" label={`${goal.name}: ${Math.round(goal.percent)}% funded`} className="mt-3" />
    </button>
  );
}
