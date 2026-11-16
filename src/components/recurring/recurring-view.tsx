"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Repeat } from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatMoney } from "@/lib/money";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { RecurringCard } from "@/components/recurring/recurring-card";
import { RecurringDetails } from "@/components/recurring/recurring-details";
import { RecurringForm, type EditableRecurring } from "@/components/recurring/recurring-form";
import type { getRecurringTransactions, PriceChange } from "@/lib/data/recurring";
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

type Tab = "all" | "subscriptions" | "income";

/** Occurrences per month for a rule, so every cadence can be summed as a monthly figure. */
function monthlyFactor(frequency: string, interval: number) {
  const perPeriod = { DAILY: 365 / 12, WEEKLY: 52 / 12, MONTHLY: 1, YEARLY: 1 / 12 }[frequency] ?? 1;
  return perPeriod / Math.max(1, interval);
}

const UPCOMING_WINDOW_DAYS = 7;

export function RecurringView({
  rules,
  priceChanges,
  currency,
  accounts,
  expenseCategories,
  incomeCategories,
}: {
  rules: RecurringRecord[];
  priceChanges: Record<string, PriceChange>;
  currency: string;
  accounts: AccountOption[];
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
}) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<RecurringRecord | undefined>(undefined);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [tab, setTab] = useState<Tab>("all");

  const summary = useMemo(() => {
    const bills = rules.filter((r) => r.isActive && r.type === "EXPENSE" && r.currency === currency);
    const committed = Math.round(bills.reduce((sum, r) => sum + r.amount * monthlyFactor(r.frequency, r.interval), 0));
    const today = startOfDay(new Date());
    const nextDays = bills.map((r) => differenceInCalendarDays(r.nextOccurrence, today)).filter((d) => d >= 0);
    return { committed, count: bills.length, nextDue: nextDays.length ? Math.min(...nextDays) : null };
  }, [rules, currency]);

  const visible = rules.filter((r) => (tab === "subscriptions" ? r.isSubscription : tab === "income" ? r.type === "INCOME" : true));
  const today = startOfDay(new Date());
  const comingUp = visible.filter((r) => r.isActive && differenceInCalendarDays(r.nextOccurrence, today) <= UPCOMING_WINDOW_DAYS);
  const later = visible.filter((r) => !comingUp.includes(r));

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
        <>
          <section className="rounded-[28px] bg-sky px-5.5 py-4.5 text-sky-text">
            <p className="text-[0.9375rem] font-semibold text-sky-text-secondary">Committed each month</p>
            <p className="mt-0.5 text-[2.5rem] font-extrabold tracking-[-1.5px]">{formatMoney(summary.committed, currency)}</p>
            <p className="text-[0.9375rem] font-medium text-sky-text-secondary">
              {summary.count} {summary.count === 1 ? "bill or subscription" : "bills and subscriptions"}
              {summary.nextDue !== null &&
                ` · next due ${summary.nextDue === 0 ? "today" : summary.nextDue === 1 ? "tomorrow" : `in ${summary.nextDue} days`}`}
            </p>
          </section>

          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: "all", label: "All" },
              { value: "subscriptions", label: "Subscriptions" },
              { value: "income", label: "Income" },
            ]}
          />

          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-secondary">Nothing here yet.</p>
          ) : (
            [
              { label: "Coming up", items: comingUp },
              { label: "Later", items: later },
            ]
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <section key={group.label}>
                  <h2 className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">{group.label}</h2>
                  <div className="flex flex-col gap-2">
                    {group.items.map((rule) => (
                      <RecurringCard key={rule.id} rule={rule} priceChange={priceChanges[rule.id]} onOpen={() => openDetails(rule)} />
                    ))}
                  </div>
                </section>
              ))
          )}
        </>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={title}>
        {showDetails && selected ? (
          <RecurringDetails rule={selected} priceChange={priceChanges[selected.id]} onEdit={() => setMode("edit")} onChanged={closeAndRefresh} />
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
