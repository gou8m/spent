"use client";

import { useMemo, useState, type FormEvent } from "react";
import { addDays, format } from "date-fns";
import { toast } from "sonner";
import { CalendarClock, Coins, Handshake, ShieldCheck, Calculator } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DatePicker } from "@/components/ui/date-picker";
import { Reveal } from "@/components/ui/reveal";
import { Chip } from "@/components/ui/chip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DetailCard, DetailChip, DetailChips } from "@/components/transactions/add-parts";
import { LoanInterestFields } from "@/components/transactions/loan-fields";
import { createStandaloneLoanAction } from "@/actions/loans";
import { useAmountField } from "@/hooks/use-amount-field";
import { computeLoan, type InterestPeriod } from "@/lib/loan-math";
import { CURRENCIES } from "@/lib/constants";
import { formatMoney, toMinorUnits } from "@/lib/money";

type Direction = "LENT" | "BORROWED";
type Counterparty = "FRIEND" | "FAMILY" | "LENDER" | "BANK";

const COUNTERPARTIES: { value: Counterparty; label: string }[] = [
  { value: "FRIEND", label: "Friend" },
  { value: "FAMILY", label: "Family" },
  { value: "LENDER", label: "Lender" },
  { value: "BANK", label: "Bank" },
];

/**
 * Add a loan that already exists, taken or given outside Spent. No transaction is created and no account balance
 * changes; interest still counts from the start date. The essentials come first; the repay-by date and the
 * currency sit behind chips, and the interest fields appear only when interest is switched on.
 */
export function AddLoanSheet({
  open,
  onOpenChange,
  defaultDirection,
  currency,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDirection: Direction;
  currency: string;
  onCreated: (direction: Direction) => void;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [direction, setDirection] = useState<Direction>(defaultDirection);
  const [who, setWho] = useState("");
  const [counterparty, setCounterparty] = useState<Counterparty>("FRIEND");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [interestOn, setInterestOn] = useState(false);
  const [rate, setRate] = useState("");
  const [period, setPeriod] = useState<InterestPeriod>("YEAR");
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [loanCurrency, setLoanCurrency] = useState(currency);
  const [showDue, setShowDue] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Each time the sheet opens it starts clean, on the tab the person was looking at.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDirection(defaultDirection);
      setWho("");
      setCounterparty("FRIEND");
      setAmount("");
      setStartDate(today);
      setInterestOn(false);
      setRate("");
      setPeriod("YEAR");
      setDueDate(format(addDays(new Date(), 30), "yyyy-MM-dd"));
      setLoanCurrency(currency);
      setShowDue(false);
      setShowCurrency(false);
      setErrors({});
    }
  }

  const { attach, value: amountText, onChange: onAmountChange } = useAmountField(amount, setAmount, loanCurrency);
  const amountMinor = toMinorUnits(Number(amount) || 0, loanCurrency);
  const borrowed = direction === "BORROWED";

  // What the loan comes to today, worked out as the details are typed.
  const preview = useMemo(() => {
    if (amountMinor <= 0 || !startDate) return null;
    const rateNum = interestOn ? Number(rate) : 0;
    const state = computeLoan(
      { principal: amountMinor, startDate: new Date(startDate), interestRate: rateNum > 0 ? rateNum : null, interestPeriod: rateNum > 0 ? period : null, interestStoppedAt: null, closedKind: null, closedAt: null },
      [],
    );
    return state;
  }, [amountMinor, startDate, interestOn, rate, period]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    const result = await createStandaloneLoanAction({
      direction,
      title: who,
      amount: Number(amount),
      currency: loanCurrency,
      startDate: new Date(startDate),
      dueDate: showDue ? new Date(dueDate) : null,
      counterpartyType: borrowed ? counterparty : null,
      interestRate: interestOn && Number(rate) > 0 ? Number(rate) : null,
      interestPeriod: interestOn && Number(rate) > 0 ? period : null,
    });
    setSaving(false);
    if (result.error) {
      // Show the message under the field it is about when we can tell, otherwise on the page.
      const message = result.error;
      const field = /who/i.test(message) ? "who" : /amount|large/i.test(message) ? "amount" : /rate|month or per year/i.test(message) ? "rate" : /start/i.test(message) ? "startDate" : /due/i.test(message) ? "dueDate" : "";
      if (field) setErrors({ [field]: message });
      else toast.error(message);
      return;
    }
    toast.success("Loan added");
    onOpenChange(false);
    onCreated(direction);
  }

  const shownError = (key: string) => errors[key];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Add an existing loan" fill>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 pb-4 pt-4">
          <SegmentedControl
            value={direction}
            onChange={setDirection}
            options={[
              { value: "BORROWED", label: "I owe" },
              { value: "LENT", label: "They owe me" },
            ]}
          />

          <div>
            <Label htmlFor="loan-who">{borrowed ? "Borrowed from" : "Lent to"}</Label>
            <Input id="loan-who" placeholder="e.g. Suresh, a bank" value={who} onChange={(e) => setWho(e.target.value)} error={!!shownError("who")} />
            <FieldError>{shownError("who")}</FieldError>
          </div>

          <Reveal show={borrowed}>
            <div>
              <Label>Who is it</Label>
              <div className="mt-1.5 grid grid-cols-4 gap-2">
                {COUNTERPARTIES.map((c) => (
                  <Chip key={c.value} selected={counterparty === c.value} className="w-full min-w-0 justify-center" onClick={() => setCounterparty(c.value)}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="loan-amount">Amount</Label>
              <Input id="loan-amount" inputMode="decimal" placeholder="0.00" ref={attach} value={amountText} onChange={onAmountChange} error={!!shownError("amount")} />
              <FieldError>{shownError("amount")}</FieldError>
            </div>
            <div>
              <Label>{borrowed ? "Taken on" : "Given on"}</Label>
              <DatePicker value={startDate} onChange={setStartDate} />
              <FieldError>{shownError("startDate")}</FieldError>
            </div>
          </div>

          <div className="rounded-lg bg-surface-2 p-4">
            <LoanInterestFields
              bare
              borrowed={borrowed}
              enabled={interestOn}
              onEnabledChange={setInterestOn}
              rate={rate}
              onRateChange={setRate}
              period={period}
              onPeriodChange={setPeriod}
              amountMinor={amountMinor}
              currency={loanCurrency}
              errors={{ loanRate: shownError("rate") ?? "" }}
            />
          </div>

          <Reveal show={!!preview}>
            {() =>
              preview && (
                <div className="flex items-center gap-3 rounded-[20px] bg-accent-subtle px-4 py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-accent text-text-on-accent">
                    <Calculator size={18} strokeWidth={2} />
                  </span>
                  <p className="text-sm font-semibold leading-snug text-accent-hover">
                    {preview.hasInterest
                      ? `By today: ${formatMoney(preview.interestAccrued, loanCurrency)} interest, ${formatMoney(preview.outstanding, loanCurrency)} in all, about ${formatMoney(preview.interestPerDay, loanCurrency)} more each day.`
                      : `No interest. ${borrowed ? "You owe" : "They owe you"} ${formatMoney(preview.outstanding, loanCurrency)}.`}
                  </p>
                </div>
              )
            }
          </Reveal>

          <DetailChips count={2}>
            <DetailChip icon={CalendarClock} label="Repay by" active={showDue} onClick={() => setShowDue((v) => !v)} />
            <DetailChip icon={Coins} label="Currency" active={showCurrency} onClick={() => setShowCurrency((v) => !v)} />
          </DetailChips>

          <Reveal show={showDue}>
            {() => (
              <DetailCard icon={CalendarClock} title={borrowed ? "Repay by" : "Return by"} hint="Reminders start the day before." onRemove={() => setShowDue(false)} removeLabel="Close">
                <div>
                  <DatePicker value={dueDate} onChange={setDueDate} />
                  <FieldError>{shownError("dueDate")}</FieldError>
                </div>
              </DetailCard>
            )}
          </Reveal>
          <Reveal show={showCurrency}>
            {() => (
              <DetailCard icon={Coins} title="Currency" hint="The loan keeps its own currency." onRemove={() => setShowCurrency(false)} removeLabel="Close">
                <Select value={loanCurrency} onValueChange={setLoanCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </DetailCard>
            )}
          </Reveal>

          <div className="flex items-center gap-3 rounded-[20px] bg-surface-2 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-accent-hover">
              <ShieldCheck size={18} strokeWidth={2} />
            </span>
            <p className="text-[0.8125rem] font-semibold leading-snug text-text-secondary">No transaction is created and no account balance changes.</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-divider bg-bg px-6 pb-[calc(0.875rem+env(safe-area-inset-bottom))] pt-3">
          <Button type="submit" size="lg" className="flex-1" loading={saving} loadingText="Saving…">
            <Handshake size={18} strokeWidth={2} />
            Save loan
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
