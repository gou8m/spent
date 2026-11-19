"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, differenceInCalendarDays, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { Plus, Calculator, ChevronDown, ArchiveRestore, Trash2 } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { Amount } from "@/components/ui/amount";
import { MonthSelector } from "@/components/ui/month-selector";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetDetail } from "@/components/budgets/budget-detail";
import { BudgetForm, type EditableBudget } from "@/components/budgets/budget-form";
import { archiveBudgetAction, deleteBudgetAction, restoreBudgetAction } from "@/actions/budgets";
import { formatMoney } from "@/lib/money";
import type { getBudgets } from "@/lib/data/budgets";
import type { CategoryOption } from "@/components/transactions/category-picker";

type BudgetRecord = Awaited<ReturnType<typeof getBudgets>>[number];

export function BudgetsView({
  budgets,
  archivedBudgets,
  categories,
  currency,
  month,
}: {
  budgets: BudgetRecord[];
  archivedBudgets: BudgetRecord[];
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
  const [showArchived, setShowArchived] = useState(false);

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

  async function handleRestore(id: string) {
    const result = await restoreBudgetAction(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Budget restored");
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

  // Rendered in BOTH the list and the detail view: the detail view's Edit and Delete buttons
  // open these, so they must exist while a budget is open (they used to be missing there,
  // which made Edit and Delete look dead).
  const dialogs = (
    <>
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
        description="Your transactions are not affected."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );

  if (selected) {
    return (
      <>
        <BudgetDetail
          budget={selected}
          currency={currency}
          onBack={() => setSelectedId(null)}
          onEdit={() => openEdit(selected)}
          onArchive={() => handleArchive(selected.id)}
          onDelete={() => setDeletingId(selected.id)}
        />
        {dialogs}
      </>
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
      <div className="flex items-center justify-between md:min-h-14 md:pr-28">
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
          {daysLeft != null && (
            <p className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1.5 text-[0.8125rem] font-bold text-hero-text dark:bg-black/10">
              {leftToSpend > 0
                ? `${formatMoney(Math.floor(leftToSpend / (daysLeft + 1)), currency)} a day for the ${daysLeft === 0 ? "last day" : `next ${daysLeft + 1} days`}`
                : "Nothing left to spend this month"}
            </p>
          )}
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
          description="Set a limit and see what is left."
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

      {archivedBudgets.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            aria-expanded={showArchived}
            className="flex w-full items-center justify-between py-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary"
          >
            Archived ({archivedBudgets.length})
            <ChevronDown size={18} className={showArchived ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
          {showArchived && (
            <ul className="flex flex-col gap-2">
              {archivedBudgets.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-[18px] bg-surface-2 px-4 py-2.5">
                  <IconChip icon={b.icon} color={b.color} size="md" flat />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{b.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRestore(b.id)}
                    className="flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-[0.8125rem] font-bold text-accent-hover"
                  >
                    <ArchiveRestore size={14} strokeWidth={2.25} />
                    Restore
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${b.name}`}
                    onClick={() => setDeletingId(b.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-surface-3"
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {dialogs}
    </div>
  );
}
