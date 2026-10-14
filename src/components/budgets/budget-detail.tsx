"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarDays, differenceInCalendarWeeks, format, startOfWeek } from "date-fns";
import { ChevronLeft, Pencil, MoreHorizontal, Trash2 } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Button } from "@/components/ui/button";
import { Amount } from "@/components/ui/amount";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getBudgetTransactionsAction } from "@/actions/budgets";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { getBudgets } from "@/lib/data/budgets";

type BudgetRecord = Awaited<ReturnType<typeof getBudgets>>[number];
type BudgetTransaction = Awaited<ReturnType<typeof getBudgetTransactionsAction>>[number];

export function BudgetDetail({
  budget,
  currency,
  onBack,
  onEdit,
  onArchive,
  onDelete,
}: {
  budget: BudgetRecord;
  currency: string;
  onBack: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [transactions, setTransactions] = useState<BudgetTransaction[] | null>(null);
  const over = budget.spent > budget.amount;

  useEffect(() => {
    getBudgetTransactionsAction(budget.id, budget.periodStart, budget.periodEnd, currency).then(setTransactions);
  }, [budget.id, budget.periodStart, budget.periodEnd, currency]);

  const weeks = Array.from({ length: differenceInCalendarWeeks(budget.periodEnd, budget.periodStart) + 1 }, (_, i) => {
    const weekStart = new Date(startOfWeek(budget.periodStart, { weekStartsOn: 1 }).getTime() + i * 7 * 86400000);
    const total = (transactions ?? [])
      .filter((tx) => differenceInCalendarWeeks(tx.date, weekStart, { weekStartsOn: 1 }) === 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { label: `Wk ${i + 1}`, total };
  });
  const maxWeek = Math.max(1, ...weeks.map((w) => w.total));

  const today = new Date();
  const daysElapsed = Math.max(1, differenceInCalendarDays(today, budget.periodStart) + 1);
  const dailyAverage = budget.spent / daysElapsed;
  const prevPeriodLength = differenceInCalendarDays(budget.periodEnd, budget.periodStart) + 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-text-primary"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 className="flex-1 truncate text-[1.625rem] font-extrabold tracking-tight text-text-primary">{budget.name}</h1>
        <button type="button" onClick={onEdit} aria-label="Edit budget" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-text-primary">
          <Pencil size={18} strokeWidth={2} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="More options" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-text-primary">
              <MoreHorizontal size={18} strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem destructive onClick={onDelete}>
              <Trash2 size={14} /> Delete budget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="-mt-3 text-[0.8125rem] font-semibold text-text-secondary">
        {format(budget.periodStart, "MMMM")} · {budget.period.charAt(0) + budget.period.slice(1).toLowerCase()} budget
      </p>

      <div
        className={cn("rounded-2xl px-6 py-6", over ? "bg-error-subtle" : undefined)}
        style={!over ? { background: "var(--hero-gradient)" } : undefined}
      >
        <p className={cn("text-[0.9375rem] font-semibold", over ? "text-error" : "text-hero-text-secondary")}>
          {over ? "Over budget by" : "Left to spend"}
        </p>
        <Amount
          value={over ? budget.spent - budget.amount : budget.remaining}
          currency={currency}
          size="lg"
          className={cn("mt-1 block", over ? "text-error" : "text-hero-text")}
        />
        <div className={cn("mt-3.5 h-3 overflow-hidden rounded-full", over ? "bg-surface" : "bg-white/60")}>
          <div
            className={cn("h-full rounded-full", over ? "bg-error" : "bg-bar-fill")}
            style={{ width: `${Math.min(100, budget.percentUsed)}%` }}
          />
        </div>
        <div className={cn("mt-2.5 flex justify-between text-[0.8125rem] font-semibold", over ? "text-error" : "text-hero-text-secondary")}>
          <span>{formatMoney(budget.spent, currency)} spent</span>
          <span>{formatMoney(budget.amount, currency)} limit · {Math.round(budget.rawPercentUsed)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-2 px-4 py-3.5">
          <p className="text-xs font-bold text-text-secondary">Daily average</p>
          <Amount value={dailyAverage} currency={currency} size="md" className="mt-1 block" />
        </div>
        <div className="rounded-lg bg-surface-2 px-4 py-3.5">
          <p className="text-xs font-bold text-text-secondary">Period length</p>
          <p className="mt-1 text-lg font-bold text-text-primary">{prevPeriodLength} days</p>
        </div>
      </div>

      <div className="rounded-lg bg-surface-2 p-4.5">
        <p className="text-[0.9375rem] font-bold text-text-primary">Spending by week</p>
        <div className="mt-3 flex h-24 items-end gap-3.5">
          {weeks.map((w) => (
            <div key={w.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn("w-full rounded-t-sm rounded-b-[4px]", w.total > budget.amount / weeks.length ? "bg-error" : "bg-chart-5")}
                style={{ height: `${Math.max(4, (w.total / maxWeek) * 80)}px` }}
              />
              <span className="text-[0.6875rem] font-semibold text-text-secondary">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xl font-bold tracking-tight text-text-primary">In this budget</p>
        <div className="mt-2.5 flex flex-col gap-2.5">
          {transactions === null ? (
            <p className="py-4 text-center text-sm text-text-secondary">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-secondary">No spending in this budget yet.</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3.5 rounded-lg bg-surface-2 px-4 py-3">
                <IconChip icon={tx.category?.icon ?? "circle"} color={tx.category?.color ?? "slate"} flat />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-semibold text-text-primary">{tx.title}</p>
                  <p className="text-xs text-text-secondary">{format(tx.date, "MMM d")}</p>
                </div>
                <Amount value={tx.amount} currency={currency} direction="EXPENSE" signed size="sm" className="font-bold" />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2.5 pt-1">
        <Button className="flex-1" onClick={onEdit}>
          {over ? "Raise limit" : "Edit budget"}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onArchive}>
          Archive
        </Button>
      </div>
    </div>
  );
}
