"use client";

import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { budgetSchema } from "@/lib/validations/budget";
import { createBudgetAction, updateBudgetAction } from "@/actions/budgets";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { IconColorPicker } from "@/components/ui/icon-color-picker";
import { IconChip } from "@/components/ui/icon-chip";
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

const PERIOD_LABELS: Record<string, string> = { WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly", CUSTOM: "Custom range" };

export function BudgetForm({
  categories,
  editing,
  onSaved,
}: {
  categories: CategoryOption[];
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
  const [icon, setIcon] = useState(editing?.icon ?? "piggy-bank");
  const [color, setColor] = useState<SwatchId>((editing?.color as SwatchId) ?? "violet");
  const [categoryIds, setCategoryIds] = useState<string[]>(editing?.categoryIds ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="budget-amount">Amount</Label>
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
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BUDGET_PERIODS.map((p) => (
                <SelectItem key={p} value={p}>{PERIOD_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <Label>Categories (optional — leave empty to cover all spending)</Label>
        <div className="grid max-h-44 grid-cols-3 gap-1 overflow-y-auto overscroll-contain rounded-2xl bg-surface-2 p-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center transition-colors hover:bg-surface-3 ${categoryIds.includes(cat.id) ? "bg-accent-subtle" : ""}`}
            >
              <IconChip icon={cat.icon} color={cat.color} size="sm" />
              <span className="line-clamp-2 w-full text-[0.6875rem] font-medium leading-tight text-text-secondary">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-full bg-surface-2 px-4 py-2.5">
        <span className="text-sm font-medium text-text-secondary">Roll over unused amount</span>
        <button
          type="button"
          role="switch"
          aria-checked={rollover}
          onClick={() => setRollover(!rollover)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${rollover ? "bg-accent" : "bg-border-strong"}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${rollover ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create budget"}
      </Button>
    </form>
  );
}
