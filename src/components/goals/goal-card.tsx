import { IconChip } from "@/components/ui/icon-chip";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { getGoals } from "@/lib/data/goals";

type GoalRecord = Awaited<ReturnType<typeof getGoals>>[number];

export function GoalCard({ goal, onOpen }: { goal: GoalRecord; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full rounded-3xl bg-surface p-4 text-left shadow-sm transition-colors hover:bg-surface-2",
        goal.status === "ARCHIVED" && "opacity-60",
      )}
    >
      <div className="flex items-center gap-3">
        <IconChip icon={goal.icon} color={goal.color} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{goal.name}</p>
          <p className="text-xs text-text-muted">
            {formatMoney(goal.currentAmount, goal.currency)} of {formatMoney(goal.targetAmount, goal.currency)}
            {goal.status === "COMPLETED" ? " · Completed" : goal.status === "ARCHIVED" ? " · Archived" : ""}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-text-secondary">{Math.round(goal.percent)}%</span>
      </div>
      <div className="mt-3">
        <Progress value={goal.percent} tone={goal.status === "COMPLETED" ? "income" : "accent"} label={`${goal.name}: ${Math.round(goal.percent)}% funded`} />
      </div>
    </button>
  );
}
