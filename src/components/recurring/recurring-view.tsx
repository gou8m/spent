"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { RecurringCard } from "@/components/recurring/recurring-card";
import { RecurringForm, type EditableRecurring } from "@/components/recurring/recurring-form";
import type { getRecurringTransactions } from "@/lib/data/recurring";
import type { AccountOption } from "@/components/transactions/account-picker";
import type { CategoryOption } from "@/components/transactions/category-picker";

type RecurringRecord = Awaited<ReturnType<typeof getRecurringTransactions>>[number];

export function RecurringView({
  rules,
  accounts,
  expenseCategories,
  incomeCategories,
}: {
  rules: RecurringRecord[];
  accounts: AccountOption[];
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
}) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EditableRecurring | undefined>(undefined);

  function openAdd() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function openEdit(rule: RecurringRecord) {
    setEditing({
      id: rule.id,
      title: rule.title,
      amount: rule.amount,
      currency: rule.currency,
      type: rule.type as "EXPENSE" | "INCOME",
      accountId: rule.accountId,
      categoryId: rule.categoryId,
      frequency: rule.frequency as EditableRecurring["frequency"],
      interval: rule.interval,
      startDate: rule.startDate,
      endDate: rule.endDate,
      isSubscription: rule.isSubscription,
    });
    setSheetOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Recurring</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus size={16} strokeWidth={2.5} />
          New
        </Button>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring transactions yet"
          description="Set up rent, salary, or subscriptions to have them added automatically."
        />
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <RecurringCard key={rule.id} rule={rule} onEdit={() => openEdit(rule)} />
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? "Edit recurring transaction" : "New recurring transaction"}>
        <RecurringForm
          accounts={accounts}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
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
