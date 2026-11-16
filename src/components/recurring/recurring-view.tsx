"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Repeat } from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { RecurringCard } from "@/components/recurring/recurring-card";
import { RecurringDetails } from "@/components/recurring/recurring-details";
import { RecurringForm, type EditableRecurring } from "@/components/recurring/recurring-form";
import type { getRecurringTransactions } from "@/lib/data/recurring";
import type { AccountOption } from "@/components/transactions/account-picker";
import type { CategoryOption } from "@/components/transactions/category-picker";

type RecurringRecord = Awaited<ReturnType<typeof getRecurringTransactions>>[number];

function toEditable(rule: RecurringRecord): EditableRecurring {
  return {
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
  };
}

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
  const [selected, setSelected] = useState<RecurringRecord | undefined>(undefined);
  const [mode, setMode] = useState<"view" | "edit">("view");

  function openAdd() {
    setSelected(undefined);
    setMode("edit");
    setSheetOpen(true);
  }

  function openDetails(rule: RecurringRecord) {
    setSelected(rule);
    setMode("view");
    setSheetOpen(true);
  }

  function closeAndRefresh() {
    setSheetOpen(false);
    router.refresh();
  }

  const showDetails = mode === "view" && !!selected;
  const title = !selected ? "New recurring" : showDetails ? "Recurring details" : "Edit recurring transaction";

  return (
    <div className="space-y-5">
      <BackHeader
        href="/profile"
        title="Recurring"
        action={
          <button
            type="button"
            aria-label="New recurring"
            onClick={openAdd}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-accent text-text-on-accent transition-colors hover:bg-accent-hover"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        }
      />

      {rules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring transactions yet"
          description="Set up rent, salary, or subscriptions to have them added automatically."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {rules.map((rule) => (
            <RecurringCard key={rule.id} rule={rule} onOpen={() => openDetails(rule)} />
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={title}>
        {showDetails && selected ? (
          <RecurringDetails rule={selected} onEdit={() => setMode("edit")} onChanged={closeAndRefresh} />
        ) : (
          <RecurringForm
            accounts={accounts}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            editing={selected ? toEditable(selected) : undefined}
            onSaved={closeAndRefresh}
          />
        )}
      </Sheet>
    </div>
  );
}
