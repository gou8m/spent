import Link from "next/link";
import { Calculator } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/lib/money";
import type { getBudgets } from "@/lib/data/budgets";

export function BudgetOverview({
  budgets,
  currency,
}: {
  budgets: Awaited<ReturnType<typeof getBudgets>>;
  currency: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budgets</CardTitle>
        <Link href="/budgets" className="text-sm font-medium text-accent-text hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="pt-3">
        {budgets.length === 0 ? (
          <EmptyState
            icon={Calculator}
            title="No budgets yet"
            description="Set a spending limit for a category to see your progress here."
          />
        ) : (
          <ul className="space-y-4">
            {budgets.map((budget) => {
              const over = budget.spent > budget.amount;
              return (
                <li key={budget.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <IconChip icon={budget.icon} color={budget.color} size="sm" />
                      <span className="truncate text-sm font-medium text-text-primary">{budget.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-text-secondary">
                      <Amount value={budget.spent} currency={currency} size="sm" className="text-text-primary" />
                      {" / "}
                      {formatMoney(budget.amount, currency)}
                    </span>
                  </div>
                  <Progress value={budget.percentUsed} tone={over ? "expense" : "accent"} label={`${Math.round(budget.percentUsed)}% of ${budget.name} budget used`} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
