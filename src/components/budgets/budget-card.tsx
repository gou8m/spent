"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Progress } from "@/components/ui/progress";
import { Amount } from "@/components/ui/amount";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { deleteBudgetAction } from "@/actions/budgets";
import { formatMoney } from "@/lib/money";
import type { getBudgets } from "@/lib/data/budgets";

type BudgetRecord = Awaited<ReturnType<typeof getBudgets>>[number];

const PERIOD_LABELS: Record<string, string> = { WEEKLY: "This week", MONTHLY: "This month", YEARLY: "This year", CUSTOM: "Custom period" };

export function BudgetCard({ budget, currency, onEdit }: { budget: BudgetRecord; currency: string; onEdit: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const over = budget.spent > budget.amount;

  async function handleDelete() {
    if (!confirm(`Delete "${budget.name}"?`)) return;
    setBusy(true);
    const result = await deleteBudgetAction(budget.id);
    setBusy(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Budget deleted");
      router.refresh();
    }
  }

  return (
    <div className="rounded-3xl bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <IconChip icon={budget.icon} color={budget.color} />
          <div>
            <p className="text-sm font-semibold text-text-primary">{budget.name}</p>
            <p className="text-xs text-text-muted">{PERIOD_LABELS[budget.period] ?? budget.period}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" disabled={busy} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-2 hover:text-text-primary">
              <MoreHorizontal size={17} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil size={14} /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem destructive onClick={handleDelete}>
              <Trash2 size={14} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <Amount value={budget.spent} currency={currency} size="md" className={over ? "text-expense" : "text-text-primary"} />
          <span className="text-xs text-text-muted">of {formatMoney(budget.amount, currency)}</span>
        </div>
        <Progress value={budget.percentUsed} tone={over ? "expense" : "accent"} label={`${Math.round(budget.percentUsed)}% of ${budget.name} budget used`} />
        <p className="mt-1.5 text-xs text-text-secondary">
          {over ? `${formatMoney(budget.spent - budget.amount, currency)} over budget` : `${formatMoney(budget.remaining, currency)} remaining`}
        </p>
      </div>
    </div>
  );
}
