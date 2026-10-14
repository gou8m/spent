import { IconChip } from "@/components/ui/icon-chip";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { getBudgets } from "@/lib/data/budgets";

type BudgetRecord = Awaited<ReturnType<typeof getBudgets>>[number];

export function BudgetCard({ budget, currency, onClick }: { budget: BudgetRecord; currency: string; onClick: () => void }) {
  const over = budget.spent > budget.amount;
  const nearLimit = !over && budget.percentUsed >= 80;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("w-full rounded-lg p-4 text-left transition-colors", over ? "bg-error-subtle" : "bg-surface-2")}
    >
      <div className="flex items-center gap-3">
        <IconChip icon={budget.icon} color={budget.color} flat />
        <span className="flex-1 truncate text-base font-semibold text-text-primary">{budget.name}</span>
        <span className="shrink-0 text-sm font-bold text-text-primary">
          {formatMoney(budget.spent, currency)}{" "}
          <span className={cn("font-medium", over ? "text-error" : "text-text-secondary")}>/ {formatMoney(budget.amount, currency)}</span>
        </span>
      </div>
      <Progress
        value={budget.percentUsed}
        tone={over ? "expense" : nearLimit ? "warning" : "accent"}
        label={`${Math.round(budget.percentUsed)}% of ${budget.name} budget used`}
        className="mt-3"
      />
      <p className={cn("mt-2 text-xs font-semibold", over ? "font-bold text-error" : "text-text-secondary")}>
        {over ? `${formatMoney(budget.spent - budget.amount, currency)} over budget` : `${formatMoney(budget.remaining, currency)} left`}
      </p>
      {budget.hasExcludedCurrency && <p className="mt-1 text-[0.6875rem] text-text-secondary">Other-currency spending not included.</p>}
    </button>
  );
}
