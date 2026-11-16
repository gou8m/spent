import Link from "next/link";
import { Calculator } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { getBudgets } from "@/lib/data/budgets";

export function BudgetOverview({
  budgets,
  currency,
}: {
  budgets: Awaited<ReturnType<typeof getBudgets>>;
  currency: string;
}) {
  return (
    <section className="rounded-3xl bg-surface-2 px-5 py-4.5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[1.0625rem] font-bold text-text-primary">Budgets</h2>
        <Link href="/budgets" className="text-[0.8125rem] font-bold text-accent-text hover:underline">
          View all
        </Link>
      </div>
      {budgets.length === 0 ? (
        <EmptyState icon={Calculator} title="No budgets yet" description="Set a spending limit for a category to see your progress here." className="py-8" />
      ) : (
        <ul className="mt-3 space-y-3.5">
          {budgets.map((budget) => {
            const over = budget.spent > budget.amount;
            return (
              <li key={budget.id}>
                <div className={cn("mb-1.5 flex items-center justify-between gap-2 text-sm", over ? "font-semibold text-error" : "text-text-secondary")}>
                  <span className={cn("truncate font-semibold", over ? "text-error" : "text-text-primary")}>{budget.name}</span>
                  <span className="shrink-0">
                    {formatMoney(budget.spent, currency, undefined, { decimals: 0 })} of {formatMoney(budget.amount, currency, undefined, { decimals: 0 })}
                  </span>
                </div>
                <Progress value={budget.percentUsed} tone={over ? "expense" : "accent"} label={`${Math.round(budget.percentUsed)}% of ${budget.name} budget used`} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
