"use client";

import { useState, useMemo, type FormEvent } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { budgetSchema } from "@/lib/validations/budget";
import { createBudgetAction, updateBudgetAction } from "@/actions/budgets";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SearchableMultiSelect } from "@/components/ui/searchable-select";
import { Toggle } from "@/components/ui/toggle";
import { IconColorPicker } from "@/components/ui/icon-color-picker";
import { BUDGET_PERIODS } from "@/lib/constants";
import type { SwatchId } from "@/lib/colors";
import type { CategoryOption } from "@/components/transactions/category-picker";

export interface EditableBudget {
  id: string;
  name: string;
  amount: number;
  period: string;
  startDate: Date;
  endDate: Date | null;
  rollover: boolean;
  icon: string;
  color: string;
  categoryIds: string[];
}

const PERIOD_LABELS: Record<string, string> = { WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly", CUSTOM: "Custom" };

export function BudgetForm({
  categories,
  currency,
  editing,
  onSaved,
}: {
  categories: CategoryOption[];
  currency: string;
  editing?: EditableBudget;
  onSaved: () => void;
}) {
  const isEditing = !!editing;
  const [name, setName] = useState(editing?.name ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount / 100) : "");
  const [period, setPeriod] = useState(editing?.period ?? "MONTHLY");
  const [startDate, setStartDate] = useState(format(editing?.startDate ?? new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(editing?.endDate ? format(editing.endDate, "yyyy-MM-dd") : "");
  const [rollover, setRollover] = useState(editing?.rollover ?? false);
  const [icon, setIcon] = useState(editing?.icon ?? "calculator");
  const [color, setColor] = useState<SwatchId>((editing?.color as SwatchId) ?? "violet");
  const [categoryIds, setCategoryIds] = useState<string[]>(editing?.categoryIds ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Every category stays individually toggleable (picking a parent is a deliberate
  // "whole group" shorthand — getBudgets expands it to the parent + all its children's
  // spend) — this only reorders the grid so each parent sits directly beside its own
  // children instead of scattered alphabetically among unrelated categories.
  const groupedCategories = useMemo(() => {
    const byParent = new Map<string, CategoryOption[]>();
    for (const c of categories) {
      if (!c.parentId) continue;
      if (!byParent.has(c.parentId)) byParent.set(c.parentId, []);
      byParent.get(c.parentId)!.push(c);
    }
    for (const list of byParent.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    const topLevel = [...categories].filter((c) => !c.parentId).sort((a, b) => a.name.localeCompare(b.name));
    return topLevel.flatMap((c) => [c, ...(byParent.get(c.id) ?? [])]);
  }, [categories]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      name,
      amount: Number(amount),
      period,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      rollover,
      icon,
      color,
      categoryIds,
    };

    const parsed = budgetSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const result = isEditing ? await updateBudgetAction(editing.id, parsed.data) : await createBudgetAction(parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEditing ? "Budget updated" : "Budget created");
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <IconColorPicker icon={icon} color={color} onChange={(v) => { setIcon(v.icon); setColor(v.color as SwatchId); }} />
        <div className="flex-1">
          <Label htmlFor="budget-name">Budget name</Label>
          <Input id="budget-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly groceries" error={!!errors.name} />
          <FieldError>{errors.name}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="budget-amount">Limit</Label>
        <Input
          id="budget-amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          error={!!errors.amount}
        />
        <FieldError>{errors.amount}</FieldError>
      </div>

      <div>
        <Label>Period</Label>
        <SegmentedControl
          options={BUDGET_PERIODS.map((p) => ({ value: p, label: PERIOD_LABELS[p] }))}
          value={period}
          onChange={setPeriod}
          className="mt-1.5"
        />
      </div>

      {period === "CUSTOM" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="budget-start">Start date</Label>
            <DatePicker value={startDate} onChange={setStartDate} />
          </div>
          <div>
            <Label htmlFor="budget-end">End date</Label>
            <DatePicker value={endDate} onChange={setEndDate} />
            <FieldError>{errors.endDate}</FieldError>
          </div>
        </div>
      )}

      <div>
        <Label>Categories counted (optional — leave empty to cover all spending)</Label>
        <div className="mt-1.5">
          <SearchableMultiSelect
            values={categoryIds}
            onChange={setCategoryIds}
            options={groupedCategories.map((c) => ({ value: c.id, label: c.name, hint: c.parentId ? "sub" : undefined }))}
            placeholder="All spending"
            searchPlaceholder="Search categories"
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-text-muted">
          Only transactions in {currency} are counted. Other currencies are excluded and noted on the budget.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-surface-2 px-4 py-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">Roll over unused amount</p>
          <p className="text-xs text-text-muted">Carry what&apos;s left (or overspent) into next period.</p>
        </div>
        <Toggle checked={rollover} onCheckedChange={setRollover} label="Roll over unused amount" />
      </div>

      <Button type="submit" className="w-full" loading={isSubmitting} loadingText="Saving…">
        {isEditing ? "Save changes" : "Create budget"}
      </Button>
    </form>
  );
}
