"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, differenceInCalendarDays, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { Plus, Calculator } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { Amount } from "@/components/ui/amount";
import { MonthSelector } from "@/components/ui/month-selector";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetDetail } from "@/components/budgets/budget-detail";
import { BudgetForm, type EditableBudget } from "@/components/budgets/budget-form";
import { archiveBudgetAction, deleteBudgetAction } from "@/actions/budgets";
import { formatMoney } from "@/lib/money";
import type { getBudgets } from "@/lib/data/budgets";
import type { CategoryOption } from "@/components/transactions/category-picker";

type BudgetRecord = Awaited<ReturnType<typeof getBudgets>>[number];

export function BudgetsView({
  budgets,
  categories,
  currency,
  month,
}: {
  budgets: BudgetRecord[];
  categories: CategoryOption[];
  currency: string;
  month: Date;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EditableBudget | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selected = budgets.find((b) => b.id === selectedId) ?? null;

  function openAdd() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function openEdit(budget: BudgetRecord) {
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

  function changeMonth(next: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", format(next, "yyyy-MM"));
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleArchive(id: string) {
    const result = await archiveBudgetAction(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Budget archived");
      setSelectedId(null);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    const result = await deleteBudgetAction(deletingId);
    setDeletingId(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Budget deleted");
      setSelectedId(null);
      router.refresh();
    }
  }

  if (selected) {
    return (
      <BudgetDetail
        budget={selected}
        currency={currency}
        onBack={() => setSelectedId(null)}
        onEdit={() => openEdit(selected)}
        onArchive={() => handleArchive(selected.id)}
        onDelete={() => setDeletingId(selected.id)}
      />
    );
  }

  const totalLimit = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const leftToSpend = totalLimit - totalSpent;
  const percentUsed = totalLimit === 0 ? 0 : Math.min(100, (totalSpent / totalLimit) * 100);
  const isCurrentMonth = format(month, "yyyy-MM") === format(new Date(), "yyyy-MM");
  const daysLeft = isCurrentMonth ? differenceInCalendarDays(endOfMonth(month), new Date()) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[2rem] font-extrabold tracking-tight text-accent-text md:tracking-[-1px] md:text-text-primary">Budgets</h1>
        <MonthSelector month={month} onChange={changeMonth} />
      </div>

      {budgets.length > 0 && (
        <div className="rounded-2xl px-6 py-6" style={{ background: "var(--hero-gradient)" }}>
          <p className="text-[0.9375rem] font-semibold text-hero-text-secondary">Left to spend</p>
          <Amount value={leftToSpend} currency={currency} size="lg" className="mt-1 block text-hero-text" />
          <div className="mt-3.5 h-3 overflow-hidden rounded-full bg-white/60">
            <div className="h-full rounded-full bg-bar-fill" style={{ width: `${percentUsed}%` }} />
          </div>
          <div className="mt-2.5 flex justify-between text-[0.8125rem] font-semibold text-hero-text-secondary">
            <span>{formatMoney(totalSpent, currency)} spent of {formatMoney(totalLimit, currency)}</span>
            {daysLeft != null && <span>{daysLeft} days left</span>}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">Categories</h2>
        <button
          type="button"
          onClick={openAdd}
          className="flex h-9 items-center gap-1 rounded-full bg-accent-subtle px-3.5 text-[0.8125rem] font-bold text-accent-hover"
        >
          <Plus size={14} strokeWidth={2.5} />
          New budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="Plan your month"
          description="Set a limit for groceries, dining or anything else and see what is left to spend."
          action={
            <button type="button" onClick={openAdd} className="h-13 rounded-md bg-accent px-6.5 text-[0.9375rem] font-bold text-text-on-accent">
              Create a budget
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} currency={currency} onClick={() => setSelectedId(budget.id)} />
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? "Edit budget" : "New budget"}>
        <BudgetForm
          categories={categories}
          currency={currency}
          editing={editing}
          onSaved={() => {
            setSheetOpen(false);
            router.refresh();
          }}
        />
      </Sheet>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete this budget?"
        description="This removes the budget. It won't affect any transactions already recorded."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
