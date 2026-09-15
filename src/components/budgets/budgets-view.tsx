"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm, type EditableBudget } from "@/components/budgets/budget-form";
import type { getBudgets } from "@/lib/data/budgets";
import type { CategoryOption } from "@/components/transactions/category-picker";

export function BudgetsView({
  budgets,
  categories,
  currency,
}: {
  budgets: Awaited<ReturnType<typeof getBudgets>>;
  categories: CategoryOption[];
  currency: string;
}) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EditableBudget | undefined>(undefined);

  function openAdd() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function openEdit(budget: (typeof budgets)[number]) {
    setEditing({
      id: budget.id,
      name: budget.name,
      amount: budget.amount,
      period: budget.period,
      startDate: budget.startDate,
      endDate: budget.endDate,
      rollover: budget.rollover,
      icon: budget.icon,
      color: budget.color,
      categoryIds: budget.categories.map((c) => c.categoryId),
    });
    setSheetOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Budgets</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus size={16} strokeWidth={2.5} />
          New budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="No budgets yet"
          description="Create a budget to set a spending limit and track your progress."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} currency={currency} onEdit={() => openEdit(budget)} />
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? "Edit budget" : "New budget"}>
        <BudgetForm
          categories={categories}
          editing={editing}
          onSaved={() => {
            setSheetOpen(false);
            router.refresh();
          }}
        />
      </Sheet>
    </div>
  );
}
