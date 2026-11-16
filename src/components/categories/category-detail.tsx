"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Pencil, GitMerge, Archive, ArchiveRestore, ChevronRight } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getCategoryInsightsAction, type CategoryInsights } from "@/actions/categories";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface DetailCategory {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  isArchived: boolean;
  parentName?: string;
  subcategories: { id: string; name: string }[];
}

/** What a category is doing: this month against last, a six-month trend, the budgets that
 * cover it and its latest transactions, with the management actions underneath. A parent
 * category's figures include its subcategories. */
export function CategoryDetail({
  category,
  onEdit,
  onMerge,
  onToggleArchive,
  onNavigate,
}: {
  category: DetailCategory;
  onEdit: () => void;
  onMerge: () => void;
  onToggleArchive: () => void;
  /** Called when a link inside leaves for another page, so the sheet can close. */
  onNavigate: () => void;
}) {
  const [result, setResult] = useState<{ id: string; data: CategoryInsights | { error: string } } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCategoryInsightsAction(category.id).then((data) => !cancelled && setResult({ id: category.id, data }));
    return () => {
      cancelled = true;
    };
  }, [category.id]);

  const insights = result?.id === category.id && !("error" in result.data) ? result.data : null;
  const failed = result?.id === category.id && "error" in result.data;
  const isExpense = category.type === "EXPENSE";

  const delta = insights && insights.lastMonth > 0 ? Math.round(((insights.thisMonth - insights.lastMonth) / insights.lastMonth) * 100) : null;
  // More spending is the "bad" direction for an expense category, more income the good one.
  const deltaGood = delta === null ? null : isExpense ? delta <= 0 : delta >= 0;
  const maxMonth = Math.max(1, ...(insights?.months.map((m) => m.amount) ?? [1]));

  return (
    <div className="space-y-4 pb-2">
      <div className="flex items-center gap-3.5">
        <IconChip icon={category.icon} color={category.color} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-extrabold tracking-tight text-text-primary">{category.name}</h2>
          <p className="text-[0.8125rem] text-text-secondary">
            {isExpense ? "Expense" : "Income"}
            {category.parentName ? ` · in ${category.parentName}` : ""}
            {category.subcategories.length > 0 ? ` · ${category.subcategories.length} subcategories` : ""}
            {category.isArchived ? " · Archived" : ""}
          </p>
        </div>
      </div>

      {failed ? (
        <p className="rounded-2xl bg-error-subtle px-4 py-3 text-sm text-error">Could not load this category&apos;s numbers. Try again in a moment.</p>
      ) : !insights ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-[22px]" />
          <Skeleton className="h-32 w-full rounded-[22px]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[22px] bg-surface-2 px-4 py-3.5">
              <p className="text-xs font-bold text-text-secondary">This month</p>
              <p className="mt-1 text-xl font-extrabold tracking-tight text-text-primary">{formatMoney(insights.thisMonth, insights.currency, undefined, { decimals: 0 })}</p>
              {delta !== null && (
                <span
                  className={cn(
                    "mt-1.5 inline-block rounded-full px-2 py-0.5 text-[0.6875rem] font-bold",
                    deltaGood ? "bg-accent-subtle text-accent-hover" : "bg-warning-subtle text-warning",
                  )}
                >
                  {delta > 0 ? "+" : ""}
                  {delta}% vs last month
                </span>
              )}
            </div>
            <div className="rounded-[22px] bg-surface-2 px-4 py-3.5">
              <p className="text-xs font-bold text-text-secondary">Last month</p>
              <p className="mt-1 text-xl font-extrabold tracking-tight text-text-primary">{formatMoney(insights.lastMonth, insights.currency, undefined, { decimals: 0 })}</p>
            </div>
          </div>

          <div className="rounded-[22px] bg-surface-2 px-4 py-3.5">
            <p className="text-[0.9375rem] font-bold text-text-primary">Last 6 months</p>
            <div className="mt-3 flex h-24 items-end gap-3">
              {insights.months.map((m, i) => (
                <div key={m.label + i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={cn("w-full rounded-t-[8px] rounded-b-[3px]", i === insights.months.length - 1 ? "bg-accent" : "bg-chart-5")}
                    style={{ height: `${Math.max(4, (m.amount / maxMonth) * 72)}px` }}
                    title={formatMoney(m.amount, insights.currency)}
                  />
                  <span className="text-[0.6875rem] font-semibold text-text-secondary">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {insights.budgets.length > 0 && (
            <div className="rounded-[22px] bg-surface-2 px-4 py-3.5">
              <p className="text-[0.9375rem] font-bold text-text-primary">Budgets covering this</p>
              <ul className="mt-2.5 space-y-3">
                {insights.budgets.map((b) => (
                  <li key={b.id}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className={cn("font-semibold", b.percent > 100 ? "text-error" : "text-text-primary")}>{b.name}</span>
                      <span className={b.percent > 100 ? "font-semibold text-error" : "text-text-secondary"}>
                        {formatMoney(b.spent, insights.currency, undefined, { decimals: 0 })} of {formatMoney(b.limit, insights.currency, undefined, { decimals: 0 })}
                      </span>
                    </div>
                    <Progress value={Math.min(100, b.percent)} tone={b.percent > 100 ? "expense" : "accent"} label={`${Math.round(b.percent)}% of ${b.name} used`} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Recent</p>
              {insights.transactionCount > 0 && (
                <Link href={`/transactions?category=${category.id}&type=${category.type}`} onClick={onNavigate} className="flex items-center gap-0.5 text-[0.8125rem] font-bold text-accent-text">
                  See all {insights.transactionCount}
                  <ChevronRight size={14} strokeWidth={2.5} />
                </Link>
              )}
            </div>
            {insights.recent.length === 0 ? (
              <p className="rounded-[22px] bg-surface-2 px-4 py-5 text-center text-sm text-text-secondary">No transactions in this category yet.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {insights.recent.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 rounded-[18px] bg-surface-2 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-primary">{t.title}</p>
                      <p className="text-xs text-text-secondary">
                        {format(new Date(t.date), "MMM d")} · {t.account}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-text-primary">{formatMoney(t.amount, t.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {category.subcategories.length > 0 && (
        <div>
          <p className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Subcategories</p>
          <div className="flex flex-wrap gap-2">
            {category.subcategories.map((s) => (
              <span key={s.id} className="rounded-full bg-surface-2 px-3.5 py-2 text-sm font-semibold text-text-primary">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <Button onClick={onEdit} className="h-12 rounded-[18px] px-2 font-bold shadow-none">
          <Pencil size={16} strokeWidth={2.25} />
          Edit
        </Button>
        <Button variant="secondary" onClick={onMerge} className="h-12 rounded-[18px] px-2 font-bold">
          <GitMerge size={16} strokeWidth={2.25} />
          Merge
        </Button>
        <Button variant="secondary" onClick={onToggleArchive} className="h-12 rounded-[18px] px-2 font-bold">
          {category.isArchived ? <ArchiveRestore size={16} strokeWidth={2.25} /> : <Archive size={16} strokeWidth={2.25} />}
          {category.isArchived ? "Restore" : "Archive"}
        </Button>
      </div>
    </div>
  );
}
