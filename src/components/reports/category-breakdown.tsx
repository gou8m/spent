"use client";

import { useState } from "react";
import { IconChip } from "@/components/ui/icon-chip";
import { Progress } from "@/components/ui/progress";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";

export interface CategoryBreakdownRow {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
}

export function CategoryBreakdown({
  expense,
  income,
  currency,
}: {
  expense: CategoryBreakdownRow[];
  income: CategoryBreakdownRow[];
  currency: string;
}) {
  const [tab, setTab] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const rows = tab === "EXPENSE" ? expense : income;

  return (
    <Card>
      <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <CardTitle>Category breakdown</CardTitle>
        <SegmentedControl
          options={[
            { value: "EXPENSE" as const, label: "Expenses" },
            { value: "INCOME" as const, label: "Income" },
          ]}
          value={tab}
          onChange={setTab}
          className="w-full sm:w-48"
        />
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">No {tab === "EXPENSE" ? "expenses" : "income"} in this range</p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.categoryId ?? "uncategorized"} className="flex items-center gap-3">
                <IconChip icon={row.icon} color={row.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-text-primary">{row.name}</span>
                    <span className="shrink-0 text-sm font-semibold text-text-primary">{formatMoney(row.amount, currency)}</span>
                  </div>
                  <Progress value={row.percent} tone={tab === "EXPENSE" ? "expense" : "income"} label={`${row.name}: ${Math.round(row.percent)}% of total`} />
                </div>
                <span className="w-10 shrink-0 text-right text-xs text-text-muted">{Math.round(row.percent)}%</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
