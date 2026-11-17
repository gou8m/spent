"use client";

import { useMemo } from "react";
import { format, startOfDay } from "date-fns";
import { Check } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { allocateRepayment, computeLoan, describeInterest, type InterestPeriod } from "@/lib/loan-math";
import { formatMoney, toMajorUnits } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { LoanSummary } from "@/lib/data/loans";

export type LoanSettlement = "KEEP" | "STOP_INTEREST" | "WAIVE" | "NEW_LOAN";

/** "Charging interest?" for money you lend, "Paying interest?" for money you borrow. */
export function LoanInterestFields({
  borrowed,
  enabled,
  onEnabledChange,
  rate,
  onRateChange,
  period,
  onPeriodChange,
  amountMinor,
  currency,
  errors,
}: {
  borrowed: boolean;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  rate: string;
  onRateChange: (v: string) => void;
  period: InterestPeriod;
  onPeriodChange: (v: InterestPeriod) => void;
  amountMinor: number;
  currency: string;
  errors: Record<string, string>;
}) {
  const rateNum = Number(rate);
  const perPeriod = enabled && rateNum > 0 && amountMinor > 0 ? Math.round((amountMinor * rateNum) / 100) : 0;
  return (
    <div className="rounded-lg bg-surface-2 p-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[0.9375rem] font-semibold text-text-primary">{borrowed ? "Paying interest?" : "Charging interest?"}</p>
          <p className="text-xs text-text-secondary">Worked out for you, day by day, until it is paid</p>
        </div>
        <Toggle checked={enabled} onCheckedChange={onEnabledChange} label={borrowed ? "Paying interest" : "Charging interest"} />
      </div>
      {enabled && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-[1fr_1.4fr] gap-3">
            <div>
              <Label htmlFor="loanRate">Rate (%)</Label>
              <Input
                id="loanRate"
                inputMode="decimal"
                placeholder="e.g. 2"
                value={rate}
                onChange={(e) => onRateChange(e.target.value.replace(/[^0-9.]/g, ""))}
                error={!!errors.loanRate}
              />
            </div>
            <div>
              <Label>Per</Label>
              <SegmentedControl
                value={period}
                onChange={onPeriodChange}
                options={[
                  { value: "MONTH", label: "Month" },
                  { value: "YEAR", label: "Year" },
                ]}
                className="mt-1.5"
              />
            </div>
          </div>
          <FieldError>{errors.loanRate}</FieldError>
          <p className="text-xs leading-relaxed text-text-secondary">
            {perPeriod > 0
              ? `About ${formatMoney(perPeriod, currency)} per ${period === "MONTH" ? "month" : "year"} on ${formatMoney(amountMinor, currency)}. `
              : ""}
            Simple interest on what is still unpaid; payments go to interest first, then the amount.
          </p>
        </div>
      )}
    </div>
  );
}

/** Pick the loans a payment settles (one or several), see how it splits, and decide what happens to a balance left over. */
export function LoanRepaymentFields({
  direction,
  loans,
  selectedIds,
  onSelectedChange,
  amountMinor,
  payDate,
  currency,
  excludeTransactionId,
  settlement,
  onSettlementChange,
  onFillAmount,
  error,
}: {
  direction: "LENT" | "BORROWED";
  loans: LoanSummary[];
  selectedIds: string[];
  onSelectedChange: (ids: string[]) => void;
  amountMinor: number;
  payDate: Date;
  currency: string;
  excludeTransactionId?: string;
  settlement: LoanSettlement;
  onSettlementChange: (s: LoanSettlement) => void;
  /** Puts this many (major units) into the amount field. */
  onFillAmount: (major: number) => void;
  error?: string;
}) {
  const dayMs = startOfDay(payDate).getTime();

  // What each loan owed on the payment date, leaving out the payment being edited.
  const rows = useMemo(() => {
    const day = new Date(dayMs);
    return (
      loans
        .filter((l) => l.direction === direction && l.currency === currency && l.state.status !== "WAIVED" && l.state.status !== "ROLLED_OVER")
        .map((l) => {
          const state = computeLoan(
            l.terms,
            l.payments.filter((p) => p.transactionId !== excludeTransactionId && startOfDay(p.date).getTime() <= dayMs),
            day,
          );
          return { loan: l, state, owed: state.outstanding };
        })
        .filter((r) => r.owed > 0 || selectedIds.includes(r.loan.id))
        .sort((a, b) => a.loan.startDate.getTime() - b.loan.startDate.getTime())
    );
  }, [loans, direction, currency, excludeTransactionId, dayMs, selectedIds]);

  const selectedRows = rows.filter((r) => selectedIds.includes(r.loan.id));
  const plan = allocateRepayment(
    amountMinor,
    selectedRows.map((r) => ({ id: r.loan.id, outstandingAt: r.owed })),
  );
  const partial = plan.allocations.find((a) => !a.clears);
  const partialRow = partial ? selectedRows.find((r) => r.loan.id === partial.loanId) : undefined;
  const residual = partial && partialRow ? partialRow.owed - partial.amount : 0;
  const totalOwed = selectedRows.reduce((sum, r) => sum + r.owed, 0);

  function toggle(id: string) {
    onSelectedChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  if (rows.length === 0) {
    return (
      <div>
        <Label>Which loans is this repaying?</Label>
        <p className="mt-1 text-sm text-text-secondary">You don&apos;t have any open {direction === "BORROWED" ? "borrowed" : "lent"} loans right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="mb-0">Which loans is this repaying?</Label>
        {rows.length > 1 && (
          <button
            type="button"
            onClick={() => onSelectedChange(selectedIds.length === rows.length ? [] : rows.map((r) => r.loan.id))}
            className="text-[0.8125rem] font-bold text-accent-text"
          >
            {selectedIds.length === rows.length ? "Clear" : "Select all"}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {rows.map(({ loan, state, owed }) => {
          const on = selectedIds.includes(loan.id);
          const interest = describeInterest(loan.interestRate, loan.interestPeriod);
          return (
            <button
              key={loan.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(loan.id)}
              className={cn("flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors", on ? "bg-accent-subtle ring-2 ring-accent" : "bg-surface-2")}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9375rem] font-bold text-text-primary">{loan.title}</span>
                <span className="block text-xs text-text-secondary">
                  {formatMoney(owed, loan.currency)} owed
                  {state.interestOutstanding > 0 ? ` (incl. ${formatMoney(state.interestOutstanding, loan.currency)} interest)` : ""}
                  {" · "}
                  {format(loan.startDate, "MMM d")}
                  {interest ? ` · ${interest}` : ""}
                </span>
              </span>
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2", on ? "border-accent bg-accent text-text-on-accent" : "border-border-strong")}>
                {on && <Check size={14} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
      <FieldError>{error}</FieldError>

      {selectedRows.length > 0 && (
        <div className="rounded-lg bg-surface-2 p-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-secondary">Owed on the selected</span>
            <span className="font-bold text-text-primary">{formatMoney(totalOwed, currency)}</span>
          </div>
          {amountMinor !== totalOwed && (
            <button type="button" onClick={() => onFillAmount(toMajorUnits(totalOwed, currency))} className="mt-1 text-[0.8125rem] font-bold text-accent-text">
              Pay all of it ({formatMoney(totalOwed, currency)})
            </button>
          )}

          {amountMinor > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-divider pt-3">
              {plan.allocations.map((a) => {
                const row = selectedRows.find((r) => r.loan.id === a.loanId)!;
                return (
                  <li key={a.loanId} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-text-primary">{row.loan.title}</span>
                    <span className="shrink-0 font-bold text-text-primary">
                      {formatMoney(a.amount, currency)}
                      <span className={cn("ml-1.5 text-xs font-semibold", a.clears ? "text-accent-text" : "text-warning")}>
                        {a.clears ? "settled" : `${formatMoney(row.owed - a.amount, currency)} left`}
                      </span>
                    </span>
                  </li>
                );
              })}
              {plan.leftover > 0 && (
                <li className="font-semibold text-error">
                  {formatMoney(plan.leftover, currency)} is more than is owed on the selected loans.
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {partial && residual > 0 && (
        <div className="rounded-lg bg-surface-2 p-4">
          <p className="text-[0.9375rem] font-semibold text-text-primary">What about the remaining {formatMoney(residual, currency)}?</p>
          <div className="mt-2.5 flex flex-col gap-2">
            {(
              [
                ["KEEP", "Keep it open", partialRow?.loan.interestRate ? "Interest keeps adding up on what is left" : "It stays as a loan until it is paid"],
                ["STOP_INTEREST", "Keep it, stop interest", "The amount owed is frozen from this date"],
                ["WAIVE", "Waive it", "Write the rest off; the loan is closed"],
                ["NEW_LOAN", "Move it to a new loan", "Closes this loan and opens a new one for what is left, with no interest"],
              ] as [LoanSettlement, string, string][]
            )
              .filter(([value]) => value !== "STOP_INTEREST" || !!partialRow?.loan.interestRate)
              .map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSettlementChange(value)}
                  className={cn("flex items-center gap-3 rounded-md px-3.5 py-2.5 text-left transition-colors", settlement === value ? "bg-accent-subtle ring-2 ring-accent" : "bg-surface")}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-text-primary">{label}</span>
                    <span className="block text-xs text-text-secondary">{hint}</span>
                  </span>
                  <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", settlement === value ? "border-accent" : "border-border-strong")}>
                    {settlement === value && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
