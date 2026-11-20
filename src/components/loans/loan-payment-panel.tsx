"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calculator, CreditCard, HandCoins, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Reveal } from "@/components/ui/reveal";
import { recordLoanPaymentAction } from "@/actions/loans";
import { useAmountField } from "@/hooks/use-amount-field";
import { checkOutsidePayment, previewOutsidePayment } from "@/lib/loan-payment";
import { decimalsForCurrency, formatMoney, toMinorUnits } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { LoanSummary } from "@/lib/data/loans";

type Way = "ACCOUNT" | "OUTSIDE";

function WayCard({ icon, title, hint, on, onClick }: { icon: React.ReactNode; title: string; hint: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[20px] border-2 px-4 py-3.5 text-left transition-[background-color,border-color,transform] active:scale-[0.99]",
        on ? "border-accent bg-accent-subtle" : "border-transparent bg-surface-2 hover:bg-surface-3",
      )}
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] transition-colors", on ? "bg-accent text-text-on-accent" : "bg-surface text-accent-hover")}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-extrabold text-text-primary">{title}</span>
        <span className="block text-xs font-medium text-text-secondary">{hint}</span>
      </span>
    </button>
  );
}

/**
 * Recording a payment on a loan: from one of the person's accounts (a normal transaction, so that balance changes)
 * or outside Spent (cash, someone else paid: nothing moves). The second way opens its few fields only once chosen.
 */
export function LoanPaymentPanel({
  loan,
  onBack,
  onFromAccount,
  onSaved,
}: {
  loan: LoanSummary;
  onBack: () => void;
  onFromAccount: () => void;
  onSaved: () => void;
}) {
  const [way, setWay] = useState<Way | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const received = loan.direction === "LENT";
  const { attach, value: amountText, onChange } = useAmountField(amount, setAmount, loan.currency);
  const minor = toMinorUnits(Number(amount) || 0, loan.currency);
  const payment = useMemo(() => ({ date: new Date(date), amount: minor }), [date, minor]);

  const preview = useMemo(() => (minor > 0 ? previewOutsidePayment(loan.terms, loan.payments, payment) : null), [loan.terms, loan.payments, payment, minor]);
  const problem = useMemo(() => (minor > 0 ? checkOutsidePayment(loan.terms, loan.payments, payment, loan.currency) : null), [loan.terms, loan.payments, payment, minor, loan.currency]);

  async function save() {
    setError(null);
    setSaving(true);
    const result = await recordLoanPaymentAction({ loanId: loan.id, amount: Number(amount), date: new Date(date), note });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(received ? "Payment received recorded" : "Payment recorded");
    onSaved();
  }

  const owedNow = loan.state.outstanding;

  return (
    <div className="space-y-3">
      <p className="text-[0.9375rem] font-extrabold text-text-primary">{received ? "How was it paid to you?" : "How did you pay?"}</p>
      <div role="radiogroup" aria-label="How it was paid" className="space-y-2.5">
        <WayCard
          icon={<CreditCard size={20} strokeWidth={2} />}
          title="From one of my accounts"
          hint={received ? "Adds income to that account" : "Adds an expense and lowers that account"}
          on={way === "ACCOUNT"}
          onClick={() => {
            setWay("ACCOUNT");
            onFromAccount();
          }}
        />
        <WayCard
          icon={<HandCoins size={20} strokeWidth={2} />}
          title="Outside Spent"
          hint="Cash or another way. No transaction, no balance change"
          on={way === "OUTSIDE"}
          onClick={() => setWay("OUTSIDE")}
        />
      </div>

      <Reveal show={way === "OUTSIDE"} gap={false}>
        {() => (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="outside-amount">Amount</Label>
                <Input id="outside-amount" inputMode="decimal" placeholder="0.00" ref={attach} value={amountText} onChange={onChange} error={!!(problem || error)} />
              </div>
              <div>
                <Label>Paid on</Label>
                <DatePicker value={date} onChange={setDate} />
              </div>
            </div>

            {owedNow > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(owedNow / 10 ** decimalsForCurrency(loan.currency)))}
                className="text-xs font-bold text-accent-text hover:underline"
              >
                Pay it all: {formatMoney(owedNow, loan.currency)}
              </button>
            )}

            <Reveal show={!!problem || !!error} gap={false}>
              {() => <FieldError>{problem ?? error}</FieldError>}
            </Reveal>

            <Reveal show={!!preview && !problem} gap={false}>
              {() =>
                preview && (
                  <div className="flex items-center gap-3 rounded-[20px] bg-accent-subtle px-4 py-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-accent text-text-on-accent">
                      <Calculator size={18} strokeWidth={2} />
                    </span>
                    <p className="text-sm font-semibold leading-snug text-accent-hover">
                      {preview.state.status === "SETTLED"
                        ? "This pays the loan off in full."
                        : preview.state.hasInterest
                          ? `${formatMoney(preview.toInterest, loan.currency)} goes to interest first, then ${formatMoney(preview.toPrincipal, loan.currency)} off the amount. ${formatMoney(preview.state.outstanding, loan.currency)} would remain.`
                          : `${formatMoney(preview.state.outstanding, loan.currency)} would remain.`}
                    </p>
                  </div>
                )
              }
            </Reveal>

            <button type="button" onClick={() => setShowNote((v) => !v)} className="flex items-center gap-2 text-xs font-bold text-accent-text hover:underline">
              <StickyNote size={14} strokeWidth={2.25} />
              {showNote ? "Hide the note" : "Add a note"}
            </button>
            <Reveal show={showNote} gap={false}>
              {() => <Input placeholder="e.g. paid in cash at home" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />}
            </Reveal>

            <Button type="button" size="lg" className="w-full" onClick={save} disabled={minor <= 0 || !!problem} loading={saving} loadingText="Saving…">
              Save payment
            </Button>
          </div>
        )}
      </Reveal>

      <Button type="button" variant="secondary" className="w-full" onClick={onBack}>
        Back
      </Button>
    </div>
  );
}
