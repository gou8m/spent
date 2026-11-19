"use client";

import { useState, useMemo, type FormEvent } from "react";
import { differenceInCalendarMonths, format } from "date-fns";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label, FieldError } from "@/components/ui/input";
import { IconChip } from "@/components/ui/icon-chip";
import { Progress } from "@/components/ui/progress";
import { Chip } from "@/components/ui/chip";
import { contributeSchema } from "@/lib/validations/goal";
import { contributeToGoalAction } from "@/actions/goals";
import { formatMoney, toMinorUnits, toMajorUnits } from "@/lib/money";
import type { getGoals } from "@/lib/data/goals";

type GoalRecord = Awaited<ReturnType<typeof getGoals>>[number];

export function ContributeDialog({
  goal,
  open,
  onOpenChange,
  onContributed,
}: {
  goal: GoalRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContributed: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount("");
      setError(null);
    }
  }

  const monthsLeft = goal.targetDate ? Math.max(1, differenceInCalendarMonths(goal.targetDate, new Date())) : null;
  const monthlyNeededMinor = monthsLeft ? goal.remaining / monthsLeft : null;
  const monthlyNeededMajor = monthlyNeededMinor != null ? String(Math.round(toMajorUnits(monthlyNeededMinor, goal.currency))) : null;

  const presets = useMemo(() => {
    const majorRemaining = toMajorUnits(goal.remaining, goal.currency);
    const raw = [0.1, 0.25, 0.5].map((f) => Math.max(1, Math.round(majorRemaining * f)));
    return Array.from(new Set(raw)).map(String);
  }, [goal.remaining, goal.currency]);

  const amountMinor = amount ? toMinorUnits(Number(amount), goal.currency) : 0;
  const projected = goal.currentAmount + amountMinor;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = contributeSchema.safeParse({ amount: Number(amount) });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    const result = await contributeToGoalAction(goal.id, parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(goal.account ? `Set aside for ${goal.name}` : `Added to ${goal.name}`);
    handleOpenChange(false);
    onContributed();
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange} title="Add money" stackLevel={1}>
      <form onSubmit={handleSubmit} className="space-y-4.5">
        <div className="rounded-xl bg-surface-2 p-4">
          <div className="flex items-center gap-3">
            <IconChip icon={goal.icon} color={goal.color} size="md" flat />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-text-primary">{goal.name}</p>
              <p className="text-xs text-text-secondary">
                {formatMoney(goal.currentAmount, goal.currency)} of {formatMoney(goal.targetAmount, goal.currency)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-extrabold text-accent-text">{Math.round(goal.percent)}%</span>
          </div>
          <Progress value={goal.percent} tone="accent" className="mt-2.5" label={`${goal.name}: ${Math.round(goal.percent)}% funded`} />
        </div>

        <div className="rounded-2xl p-5 text-center" style={{ background: "var(--hero-gradient)" }}>
          <label htmlFor="contribute-amount" className="text-sm font-semibold text-hero-text-secondary">
            Amount to add
          </label>
          <div className="mt-1 flex items-center justify-center overflow-hidden">
            <input
              id="contribute-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              size={Math.max(4, amount.length || 4)}
              className={`max-w-full bg-transparent text-center font-extrabold tracking-tight text-hero-text placeholder:text-hero-text-secondary focus:outline-none ${amount.length > 9 ? "text-3xl" : "text-[3.25rem]"}`}
            />
          </div>
          {amount && (
            <p className="mt-1 text-[0.8125rem] font-semibold text-hero-text-secondary">
              {goal.name} will be {formatMoney(projected, goal.currency)} of {formatMoney(goal.targetAmount, goal.currency)}
            </p>
          )}
        </div>
        <FieldError>{error}</FieldError>

        {goal.account && (
          <div>
            <Label>Saved in</Label>
            <div className="flex h-13 items-center rounded-md bg-surface-2 px-4 text-[0.9375rem] font-semibold text-text-primary">
              {goal.account.name}
            </div>
            <p className="mt-1.5 text-xs leading-snug text-text-secondary">
              This money is already in {goal.account.name}. It is set aside for this goal, not moved, and can only come from what is not already
              set aside for other goals.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Chip key={p} type="button" selected={amount === p} onClick={() => setAmount(p)}>
              {formatMoney(toMinorUnits(Number(p), goal.currency), goal.currency, undefined, { compact: true })}
            </Chip>
          ))}
          {monthlyNeededMajor && (
            <Chip type="button" selected={amount === monthlyNeededMajor} onClick={() => setAmount(monthlyNeededMajor)}>
              Monthly amount
            </Chip>
          )}
        </div>

        {monthlyNeededMinor != null && goal.targetDate && (
          <p className="text-[0.8125rem] leading-relaxed text-text-secondary">
            Needs {formatMoney(monthlyNeededMinor, goal.currency)} a month to finish by {format(goal.targetDate, "MMMM yyyy")}.
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} loadingText="Adding…" disabled={!amount}>
          {amount ? `Add ${formatMoney(amountMinor, goal.currency)}` : "Add money"}
        </Button>
      </form>
    </Sheet>
  );
}
