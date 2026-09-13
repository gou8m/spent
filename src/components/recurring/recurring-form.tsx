"use client";

import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { recurringSchema } from "@/lib/validations/recurring";
import { createRecurringAction, updateRecurringAction } from "@/actions/recurring";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AccountPicker, type AccountOption } from "@/components/transactions/account-picker";
import { CategoryPicker, type CategoryOption } from "@/components/transactions/category-picker";
import { decimalsForCurrency } from "@/lib/money";
import { RECURRING_FREQUENCIES, type RecurringFrequency } from "@/lib/constants";

type TxType = "EXPENSE" | "INCOME";

export interface EditableRecurring {
  id: string;
  title: string;
  amount: number;
  currency: string;
  type: TxType;
  accountId: string;
  categoryId: string | null;
  frequency: RecurringFrequency;
  interval: number;
  startDate: Date;
  endDate: Date | null;
  isSubscription: boolean;
}

const FREQUENCY_UNIT_LABELS: Record<RecurringFrequency, string> = {
  DAILY: "Day(s)",
  WEEKLY: "Week(s)",
  MONTHLY: "Month(s)",
  YEARLY: "Year(s)",
};

export function RecurringForm({
  accounts,
  expenseCategories,
  incomeCategories,
  editing,
  onSaved,
}: {
  accounts: AccountOption[];
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
  editing?: EditableRecurring;
  onSaved: () => void;
}) {
  const isEditing = !!editing;

  const [type, setType] = useState<TxType>(editing?.type ?? "EXPENSE");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount / 10 ** decimalsForCurrency(editing.currency)) : "");
  const [accountId, setAccountId] = useState(editing?.accountId ?? accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [frequency, setFrequency] = useState<RecurringFrequency>(editing?.frequency ?? "MONTHLY");
  const [intervalValue, setIntervalValue] = useState(editing ? String(editing.interval) : "1");
  const [startDate, setStartDate] = useState(format(editing?.startDate ?? new Date(), "yyyy-MM-dd"));
  const [hasEndDate, setHasEndDate] = useState(!!editing?.endDate);
  const [endDate, setEndDate] = useState(format(editing?.endDate ?? new Date(), "yyyy-MM-dd"));
  const [isSubscription, setIsSubscription] = useState(editing?.isSubscription ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = type === "INCOME" ? incomeCategories : expenseCategories;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      title,
      amount: Number(amount),
      type,
      accountId,
      categoryId: categoryId || undefined,
      frequency,
      interval: Number(intervalValue),
      startDate: new Date(startDate),
      endDate: hasEndDate ? new Date(endDate) : undefined,
      isSubscription,
    };

    const parsed = recurringSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const result = isEditing
      ? await updateRecurringAction(editing.id, parsed.data)
      : await createRecurringAction(parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Recurring transaction updated" : "Recurring transaction created");
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SegmentedControl
        value={type}
        onChange={(v) => {
          setType(v);
          setCategoryId("");
        }}
        options={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
        ]}
      />

      <div>
        <Label htmlFor="recurring-title">Title</Label>
        <Input
          id="recurring-title"
          placeholder="e.g. Rent, Netflix, Salary"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={!!errors.title}
        />
        <FieldError>{errors.title}</FieldError>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="recurring-amount">Amount</Label>
          <Input
            id="recurring-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            error={!!errors.amount}
          />
          <FieldError>{errors.amount}</FieldError>
        </div>
        <div>
          <Label>Account</Label>
          <AccountPicker accounts={accounts} value={accountId} onChange={setAccountId} />
          <FieldError>{errors.accountId}</FieldError>
        </div>
      </div>

      <div>
        <Label>Category</Label>
        <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        <FieldError>{errors.categoryId}</FieldError>
      </div>

      <div className="grid grid-cols-[6.5rem_1fr] gap-3">
        <div>
          <Label htmlFor="recurring-interval">Every</Label>
          <Input
            id="recurring-interval"
            inputMode="numeric"
            value={intervalValue}
            onChange={(e) => setIntervalValue(e.target.value.replace(/[^0-9]/g, ""))}
            error={!!errors.interval}
          />
        </div>
        <div>
          <Label>&nbsp;</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringFrequency)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECURRING_FREQUENCIES.map((f) => (
                <SelectItem key={f} value={f}>
                  {FREQUENCY_UNIT_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <FieldError>{errors.interval}</FieldError>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Start date</Label>
          <DatePicker value={startDate} onChange={setStartDate} />
        </div>
        {hasEndDate && (
          <div>
            <Label>End date</Label>
            <DatePicker value={endDate} onChange={setEndDate} />
            <FieldError>{errors.endDate}</FieldError>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-full bg-surface-2 px-4 py-2.5">
        <span className="text-sm font-medium text-text-secondary">Has an end date</span>
        <button
          type="button"
          role="switch"
          aria-checked={hasEndDate}
          onClick={() => setHasEndDate(!hasEndDate)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${hasEndDate ? "bg-accent" : "bg-border-strong"}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${hasEndDate ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      <div className="flex items-center justify-between rounded-full bg-surface-2 px-4 py-2.5">
        <span className="text-sm font-medium text-text-secondary">This is a subscription</span>
        <button
          type="button"
          role="switch"
          aria-checked={isSubscription}
          onClick={() => setIsSubscription(!isSubscription)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${isSubscription ? "bg-accent" : "bg-border-strong"}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isSubscription ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create recurring transaction"}
      </Button>
    </form>
  );
}
