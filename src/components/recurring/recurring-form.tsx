"use client";

import { useState, type FormEvent } from "react";
import { History } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { format } from "date-fns";
import { toast } from "sonner";
import { recurringSchema } from "@/lib/validations/recurring";
import { createRecurringAction, lookupRecurringHintAction, updateRecurringAction } from "@/actions/recurring";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DatePicker } from "@/components/ui/date-picker";
import { Toggle } from "@/components/ui/toggle";
import { AccountPicker, type AccountOption } from "@/components/transactions/account-picker";
import { CategoryPicker, type CategoryOption } from "@/components/transactions/category-picker";
import { PromptCard } from "@/components/transactions/add-parts";
import { ScheduleQuestions } from "@/components/recurring/schedule-questions";
import { useAmountField } from "@/hooks/use-amount-field";
import { decimalsForCurrency, formatMoney } from "@/lib/money";
import { RECURRING_FREQUENCIES, RECURRING_CATEGORY_NAMES, EMERGENCY_FUND_CATEGORY_NAME, type RecurringFrequency } from "@/lib/constants";
import type { DayRule } from "@/lib/recurrence";

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
  dayRule: DayRule;
  amountVaries: boolean;
  bonusAmount: number | null;
  bonusEveryMonths: number | null;
}

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

const FREQUENCY_UNITS: Record<RecurringFrequency, string> = {
  DAILY: "day",
  WEEKLY: "week",
  MONTHLY: "month",
  YEARLY: "year",
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
  const [dayRule, setDayRule] = useState<DayRule>(editing?.dayRule ?? "DAY");
  const [amountVaries, setAmountVaries] = useState(editing?.amountVaries ?? false);
  const [bonusOn, setBonusOn] = useState(!!editing?.bonusAmount);
  const [bonusAmount, setBonusAmount] = useState(
    editing?.bonusAmount ? String(editing.bonusAmount / 10 ** decimalsForCurrency(editing.currency)) : "",
  );
  const [bonusEvery, setBonusEvery] = useState(editing?.bonusEveryMonths ? String(editing.bonusEveryMonths) : "3");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // "Use your last amount": offered once the title matches something already recorded.
  const [hint, setHint] = useState<{ amount: number; currency: string; accountId: string; accountName: string; categoryId: string | null } | null>(null);

  const accountCurrency = accounts.find((a) => a.id === accountId)?.currency ?? "USD";
  const { attach: attachAmount, value: amountText, onChange: onAmountChange } = useAmountField(amount, setAmount, accountCurrency);

  const categories = (type === "INCOME" ? incomeCategories : expenseCategories).filter((c) =>
    RECURRING_CATEGORY_NAMES.includes(c.name),
  );

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    setErrors((prev) => (prev.categoryId ? { ...prev, categoryId: "" } : prev));
    const category = categories.find((c) => c.id === id);
    if (category?.name === EMERGENCY_FUND_CATEGORY_NAME) {
      // The account the user has explicitly marked as their Emergency Fund (Account
      // form's "This is my Emergency Fund" toggle) — not just "any SAVINGS account",
      // which used to pick whichever one happened to be first when more than one existed.
      const emergencyFundAccount = accounts.find((a) => a.isEmergencyFund);
      if (emergencyFundAccount) setAccountId(emergencyFundAccount.id);
    }
  }

  async function lookUpTitle() {
    if (isEditing || amount) return;
    const found = await lookupRecurringHintAction(title, type);
    setHint(found && accounts.some((a) => a.id === found.accountId) ? found : null);
  }

  function useHint() {
    if (!hint) return;
    setAmount(String(hint.amount / 10 ** decimalsForCurrency(hint.currency)));
    setAccountId(hint.accountId);
    if (hint.categoryId && categories.some((c) => c.id === hint.categoryId)) setCategoryId(hint.categoryId);
    setHint(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const monthly = frequency === "MONTHLY";
    const withBonus = type === "INCOME" && monthly && bonusOn;
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
      isSubscription: editing?.isSubscription ?? false,
      dayRule: monthly ? dayRule : ("DAY" as DayRule),
      amountVaries,
      bonusAmount: withBonus ? Number(bonusAmount) || undefined : undefined,
      bonusEveryMonths: withBonus ? Number(bonusEvery) || undefined : undefined,
      skipFirst: false,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <SegmentedControl
        value={type}
        onChange={(v) => {
          setType(v);
          setCategoryId("");
          setHint(null);
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
          onBlur={lookUpTitle}
          error={!!errors.title}
        />
        <FieldError>{errors.title}</FieldError>
      </div>

      <Reveal show={!!hint}>
        {() => (
          <PromptCard
            tone="green"
            icon={History}
            title={`Use your last ${title.trim()}?`}
            hint={`${formatMoney(hint!.amount, hint!.currency)} from ${hint!.accountName}.`}
            primaryLabel="Use it"
            secondaryLabel="No thanks"
            onPrimary={useHint}
            onSecondary={() => setHint(null)}
          />
        )}
      </Reveal>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="recurring-amount">{amountVaries ? "Usual amount" : "Amount"}</Label>
          <Input
            id="recurring-amount"
            inputMode="decimal"
            placeholder="0.00"
            ref={attachAmount}
            value={amountText}
            onChange={onAmountChange}
            error={!!errors.amount}
          />
          <FieldError>{errors.amount}</FieldError>
        </div>
        <div>
          <Label>Account</Label>
          <AccountPicker
            accounts={accounts}
            value={accountId}
            onChange={(id) => {
              setAccountId(id);
              setErrors((prev) => (prev.accountId ? { ...prev, accountId: "" } : prev));
            }}
            forExpense={type === "EXPENSE"}
            error={!!errors.accountId}
          />
          <FieldError>{errors.accountId}</FieldError>
        </div>
      </div>

      <div>
        <Label>Category</Label>
        <CategoryPicker categories={categories} value={categoryId} onChange={handleCategoryChange} type={type} error={!!errors.categoryId} />
        <FieldError>{errors.categoryId}</FieldError>
      </div>

      <div>
        <Label>Repeats</Label>
        <SegmentedControl
          options={RECURRING_FREQUENCIES.map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }))}
          value={frequency}
          onChange={setFrequency}
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="recurring-interval">Every ({FREQUENCY_UNITS[frequency]}s)</Label>
          <Input
            id="recurring-interval"
            inputMode="numeric"
            value={intervalValue}
            onChange={(e) => setIntervalValue(e.target.value.replace(/[^0-9]/g, ""))}
            error={!!errors.interval}
          />
          <FieldError>{errors.interval}</FieldError>
        </div>
        <div>
          <Label>Starts</Label>
          <DatePicker value={startDate} onChange={setStartDate} />
        </div>
      </div>

      <ScheduleQuestions
        type={type}
        title={title}
        frequency={frequency}
        startDate={startDate}
        currency={accountCurrency}
        value={{ dayRule, amountVaries, bonusOn, bonusAmount, bonusEvery }}
        onChange={(patch) => {
          if (patch.dayRule !== undefined) setDayRule(patch.dayRule);
          if (patch.amountVaries !== undefined) setAmountVaries(patch.amountVaries);
          if (patch.bonusOn !== undefined) setBonusOn(patch.bonusOn);
          if (patch.bonusAmount !== undefined) setBonusAmount(patch.bonusAmount);
          if (patch.bonusEvery !== undefined) setBonusEvery(patch.bonusEvery);
        }}
        errors={errors}
        open={isEditing || title.trim().length >= 2}
        initiallyDone={isEditing}
      />

      <Reveal show={hasEndDate}>
        <div>
          <Label>Ends</Label>
          <DatePicker value={endDate} onChange={setEndDate} />
          <FieldError>{errors.endDate}</FieldError>
        </div>
      </Reveal>

      <div className="flex min-h-15 items-center gap-3 rounded-[20px] bg-surface-2 px-4 py-2">
        <p className="flex-1 text-[0.9375rem] font-semibold text-text-primary">Has an end date</p>
        <Toggle checked={hasEndDate} onCheckedChange={setHasEndDate} label="Has an end date" />
      </div>

      <Button type="submit" className="w-full" loading={isSubmitting} loadingText="Saving…">
        {isEditing ? "Save changes" : "Save recurring"}
      </Button>
    </form>
  );
}
