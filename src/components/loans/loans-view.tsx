"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, differenceInCalendarDays, startOfDay } from "date-fns";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Handshake, Pencil, Plus, Ban, FilePlus2, Snowflake, Play, Undo2, ChevronRight, Landmark, Trash2 } from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SlidingTabs } from "@/components/ui/sliding-tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Reveal } from "@/components/ui/reveal";
import { AddLoanSheet } from "@/components/loans/add-loan-sheet";
import { LoanPaymentPanel } from "@/components/loans/loan-payment-panel";
import { useAmountField } from "@/hooks/use-amount-field";
import { DatePicker } from "@/components/ui/date-picker";
import { LoanInterestFields } from "@/components/transactions/loan-fields";
import { deleteLoanPaymentAction, deleteStandaloneLoanAction, settleLoanAction, updateLoanTermsAction } from "@/actions/loans";
import { describeInterest, type InterestPeriod, type LoanEvent } from "@/lib/loan-math";
import { decimalsForCurrency, formatMoney } from "@/lib/money";
import { useTransactionSheet } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import type { LoanSummary } from "@/lib/data/loans";

type Direction = "LENT" | "BORROWED";
type Filter = "open" | "closed";

function statusOf(loan: LoanSummary): { label: string; tone: "accent" | "warning" | "expense" | "neutral" | "income" } {
  const { status } = loan.state;
  if (status === "SETTLED") return { label: "Settled", tone: "income" };
  if (status === "WAIVED") return { label: "Waived", tone: "neutral" };
  if (status === "ROLLED_OVER") return { label: "Moved to a new loan", tone: "neutral" };
  const days = differenceInCalendarDays(loan.dueDate, startOfDay(new Date()));
  if (days < 0) return { label: `Overdue ${Math.abs(days)}d`, tone: "expense" };
  if (days <= 7) return { label: days === 0 ? "Due today" : `Due in ${days}d`, tone: "warning" };
  return { label: `Due ${format(loan.dueDate, "MMM d")}`, tone: "accent" };
}

export function LoansView({ loans, currency }: { loans: LoanSummary[]; currency: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [direction, setDirection] = useState<Direction>("LENT");
  const [filter, setFilter] = useState<Filter>("open");
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("loan"));
  const [adding, setAdding] = useState(false);

  // A link from a transaction (?loan=ID) opens that loan, on the tab it belongs to.
  const [handledParam, setHandledParam] = useState(false);
  if (!handledParam) {
    setHandledParam(true);
    const wanted = loans.find((l) => l.id === searchParams.get("loan"));
    if (wanted) {
      setDirection(wanted.direction);
      setFilter(wanted.state.status === "OPEN" ? "open" : "closed");
    }
  }

  const selected = loans.find((l) => l.id === selectedId) ?? null;

  const totals = useMemo(() => {
    const sum = (d: Direction) => loans.filter((l) => l.direction === d && l.state.status === "OPEN" && l.currency === currency).reduce((n, l) => n + l.state.outstanding, 0);
    const interest = (d: Direction) => loans.filter((l) => l.direction === d && l.currency === currency).reduce((n, l) => n + l.state.interestAccrued, 0);
    return {
      owedToYou: sum("LENT"),
      youOwe: sum("BORROWED"),
      interestEarned: interest("LENT"),
      interestPaid: interest("BORROWED"),
      otherCurrency: loans.some((l) => l.state.status === "OPEN" && l.currency !== currency),
    };
  }, [loans, currency]);

  const shown = loans
    .filter((l) => l.direction === direction && (filter === "open" ? l.state.status === "OPEN" : l.state.status !== "OPEN"))
    .sort((a, b) => (filter === "open" ? a.dueDate.getTime() - b.dueDate.getTime() : b.startDate.getTime() - a.startDate.getTime()));
  const openCount = loans.filter((l) => l.direction === direction && l.state.status === "OPEN").length;

  return (
    <div className="space-y-4">
      <BackHeader
        href="/accounts"
        title="Loans"
        action={
          <button
            type="button"
            aria-label="Add an existing loan"
            onClick={() => setAdding(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-accent text-text-on-accent transition-transform active:scale-95"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[22px] bg-surface-2 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-income-subtle text-income">
            <ArrowDownLeft size={18} strokeWidth={2.25} />
          </span>
          <p className="mt-2.5 text-xs font-semibold text-text-secondary">You are owed</p>
          <p className="mt-0.5 font-numeric text-xl font-extrabold tracking-tight text-text-primary">{formatMoney(totals.owedToYou, currency, undefined, { decimals: 0 })}</p>
          {totals.interestEarned > 0 && <p className="mt-0.5 text-xs text-text-secondary">{formatMoney(totals.interestEarned, currency, undefined, { decimals: 0 })} interest</p>}
        </div>
        <div className="rounded-[22px] bg-surface-2 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-expense-subtle text-expense">
            <ArrowUpRight size={18} strokeWidth={2.25} />
          </span>
          <p className="mt-2.5 text-xs font-semibold text-text-secondary">You owe</p>
          <p className="mt-0.5 font-numeric text-xl font-extrabold tracking-tight text-text-primary">{formatMoney(totals.youOwe, currency, undefined, { decimals: 0 })}</p>
          {totals.interestPaid > 0 && <p className="mt-0.5 text-xs text-text-secondary">{formatMoney(totals.interestPaid, currency, undefined, { decimals: 0 })} interest</p>}
        </div>
      </div>
      {totals.otherCurrency && <p className="-mt-2 text-xs text-text-secondary">Loans in other currencies are listed below but not added into these totals.</p>}

      <SegmentedControl
        value={direction}
        onChange={setDirection}
        options={[
          { value: "LENT", label: "I lent" },
          { value: "BORROWED", label: "I borrowed" },
        ]}
      />

      <SlidingTabs
        options={[
          { value: "open" as Filter, label: `Open${openCount ? ` (${openCount})` : ""}` },
          { value: "closed" as Filter, label: "Closed" },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {shown.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={filter === "open" ? "Nothing open" : "No closed loans"}
          description={
            direction === "LENT"
              ? "Lent money from an account? Add it as a Loan in a new transaction. Gave it long ago or in cash? Use the + button."
              : "Borrowed into an account? Add it as a Loan in a new transaction. Took it long ago or in cash? Use the + button."
          }
        />
      ) : (
        <ul key={`${direction}:${filter}`} className="animate-fade-up flex flex-col gap-2.5">
          {shown.map((loan) => {
            const st = statusOf(loan);
            const total = loan.originalAmount + loan.state.interestAccrued;
            const paidPct = total > 0 ? (loan.state.paidTotal / total) * 100 : 0;
            const closed = loan.state.status !== "OPEN";
            return (
              <li key={loan.id}>
                <button type="button" onClick={() => setSelectedId(loan.id)} className="w-full rounded-[22px] bg-surface-2 p-4 text-left transition-colors hover:bg-surface-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2">
                        <span className="min-w-0 truncate text-base font-bold text-text-primary">{loan.title}</span>
                        {loan.standalone && <Badge tone="neutral" className="shrink-0">Outside Spent</Badge>}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {formatMoney(loan.originalAmount, loan.currency)} on {format(loan.startDate, "MMM d, yyyy")}
                        {describeInterest(loan.interestRate, loan.interestPeriod) ? ` · ${describeInterest(loan.interestRate, loan.interestPeriod)}` : ""}
                      </p>
                    </div>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-text-secondary">{closed ? (loan.state.status === "SETTLED" ? "Paid back" : "Closed with") : "Owed now"}</p>
                      <p className="font-numeric text-[1.375rem] font-extrabold leading-tight tracking-tight text-text-primary">
                        {formatMoney(closed ? (loan.state.status === "SETTLED" ? loan.state.paidTotal : loan.state.closedAmount) : loan.state.outstanding, loan.currency)}
                      </p>
                    </div>
                    <ChevronRight size={18} className="mb-1.5 shrink-0 text-text-secondary" />
                  </div>
                  {loan.state.paidTotal > 0 && !closed && (
                    <div className="mt-3">
                      <Progress value={paidPct} tone="income" label={`${Math.round(paidPct)}% of ${loan.title} paid back`} />
                      <p className="mt-1.5 text-xs text-text-secondary">{formatMoney(loan.state.paidTotal, loan.currency)} paid back so far</p>
                    </div>
                  )}
                  {loan.state.interestOutstanding > 0 && !closed && (
                    <p className="mt-1.5 text-xs text-text-secondary">Includes {formatMoney(loan.state.interestOutstanding, loan.currency)} interest</p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex w-full items-center gap-3 rounded-[22px] border-2 border-dashed border-border-strong p-4 text-left transition-colors hover:bg-surface-2"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface-2 text-accent-hover">
          <Landmark size={22} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.9375rem] font-extrabold text-text-primary">Add an existing loan</span>
          <span className="block text-xs font-medium text-text-secondary">Taken or given long ago? Record it here. No transaction is created.</span>
        </span>
      </button>

      <AddLoanSheet
        open={adding}
        onOpenChange={setAdding}
        defaultDirection={direction === "LENT" ? "LENT" : "BORROWED"}
        currency={currency}
        onCreated={(d) => {
          setDirection(d);
          setFilter("open");
          router.refresh();
        }}
      />

      <LoanSheet
        loan={selected}
        onClose={() => setSelectedId(null)}
        onChanged={() => router.refresh()}
      />
    </div>
  );
}

function eventLabel(e: LoanEvent, direction: Direction): string {
  switch (e.kind) {
    case "GIVEN":
      return direction === "LENT" ? "Lent" : "Borrowed";
    case "PAYMENT":
      return direction === "LENT" ? "Paid back to you" : "You paid back";
    case "INTEREST_STOPPED":
      return "Interest stopped";
    case "WAIVED":
      return "Waived";
    case "ROLLED_OVER":
      return "Moved to a new loan";
  }
}

function LoanSheet({ loan, onClose, onChanged }: { loan: LoanSummary | null; onClose: () => void; onChanged: () => void }) {
  const openTransaction = useTransactionSheet((s) => s.open);
  const [mode, setMode] = useState<"view" | "edit" | "settle" | "pay">("view");
  const [busy, setBusy] = useState(false);
  const [removePaymentId, setRemovePaymentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);

  // Always start on the overview when a different loan is opened.
  if ((loan?.id ?? null) !== lastId) {
    setLastId(loan?.id ?? null);
    setMode("view");
  }

  async function run(mode: "WAIVE" | "NEW_LOAN" | "STOP_INTEREST" | "RESUME_INTEREST" | "REOPEN", success: string) {
    if (!loan) return;
    setBusy(true);
    const result = await settleLoanAction({ loanId: loan.id, mode });
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(success);
    setMode("view");
    onChanged();
    if (mode === "NEW_LOAN") onClose();
  }

  async function removePayment() {
    if (!removePaymentId) return;
    setBusy(true);
    const result = await deleteLoanPaymentAction(removePaymentId);
    setBusy(false);
    setRemovePaymentId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Payment removed");
    onChanged();
  }

  async function deleteLoan() {
    if (!loan) return;
    setBusy(true);
    const result = await deleteStandaloneLoanAction(loan.id);
    setBusy(false);
    setConfirmDelete(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Loan deleted");
    onClose();
    onChanged();
  }

  return (
    <>
    <Sheet open={!!loan} onOpenChange={(o) => !o && onClose()} title={loan ? loan.title : "Loan"}>
      {loan && (
        <div key={mode} className="animate-fade-in">
          {mode === "edit" ? (
          <EditTerms loan={loan} onCancel={() => setMode("view")} onSaved={() => { setMode("view"); onChanged(); }} />
        ) : (
          <div className="space-y-4">
            <LoanOverview loan={loan} onRemovePayment={setRemovePaymentId} />

            {mode === "pay" ? (
              <LoanPaymentPanel
                loan={loan}
                onBack={() => setMode("view")}
                onFromAccount={() => {
                  onClose();
                  openTransaction({ type: loan.direction === "LENT" ? "INCOME" : "EXPENSE", repayLoanId: loan.id });
                }}
                onSaved={() => {
                  setMode("view");
                  onChanged();
                }}
              />
            ) : mode === "settle" ? (
              <div className="space-y-2.5 rounded-[22px] bg-surface-2 p-4">
                <p className="text-[0.9375rem] font-bold text-text-primary">Close out the remaining {formatMoney(loan.state.outstanding, loan.currency)}</p>
                <SettleOption icon={<Ban size={18} />} title="Waive it" hint="Write it off; this loan is closed" disabled={busy} onClick={() => run("WAIVE", "Remaining amount waived")} />
                <SettleOption icon={<FilePlus2 size={18} />} title="Move it to a new loan" hint="Closes this one and opens a new loan for the same amount, no interest" disabled={busy} onClick={() => run("NEW_LOAN", "Moved to a new loan")} />
                {loan.interestRate && !loan.interestStoppedAt && (
                  <SettleOption icon={<Snowflake size={18} />} title="Keep it, stop interest" hint="The amount owed stays as it is today" disabled={busy} onClick={() => run("STOP_INTEREST", "Interest stopped")} />
                )}
                <Button type="button" variant="secondary" className="w-full" onClick={() => setMode("view")}>
                  Back
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {loan.state.status === "OPEN" && (
                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    onClick={() => setMode("pay")}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    {loan.direction === "LENT" ? "Record a payment received" : "Record a payment I made"}
                  </Button>
                )}
                <div className="flex gap-2.5">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setMode("edit")}>
                    <Pencil size={16} />
                    Edit terms
                  </Button>
                  {loan.state.status === "OPEN" && loan.state.outstanding > 0 && (
                    <Button type="button" variant="secondary" className="flex-1" onClick={() => setMode("settle")}>
                      Close out
                    </Button>
                  )}
                </div>
                {loan.state.status === "OPEN" && loan.interestStoppedAt && (
                  <Button type="button" variant="secondary" className="w-full" disabled={busy} onClick={() => run("RESUME_INTEREST", "Interest resumed")}>
                    <Play size={16} />
                    Resume interest
                  </Button>
                )}
                {(loan.state.status === "WAIVED" || loan.state.status === "ROLLED_OVER") && (
                  <Button type="button" variant="secondary" className="w-full" disabled={busy} onClick={() => run("REOPEN", "Loan reopened")}>
                    <Undo2 size={16} />
                    Reopen this loan
                  </Button>
                )}
                {loan.standalone && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-[16px] text-sm font-bold text-error"
                  >
                    <Trash2 size={16} />
                    Delete this loan
                  </button>
                )}
                {loan.originTransactionId && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openTransaction({ transactionId: loan.originTransactionId! });
                    }}
                    className="flex h-11 w-full items-center justify-center rounded-[16px] text-sm font-bold text-accent-text"
                  >
                    View the original transaction
                  </button>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      )}
    </Sheet>
    <ConfirmDialog
      open={!!removePaymentId}
      onOpenChange={(o) => !o && setRemovePaymentId(null)}
      title="Remove this payment?"
      icon={<Trash2 size={24} strokeWidth={2} />}
      description="It was recorded outside Spent. The amount goes back onto the loan."
      confirmLabel="Remove"
      destructive
      isConfirming={busy}
      onConfirm={removePayment}
    />
    <ConfirmDialog
      open={confirmDelete}
      onOpenChange={setConfirmDelete}
      title="Delete this loan?"
      icon={<Trash2 size={24} strokeWidth={2} />}
      description="The loan and the payments recorded on it are removed. Your transactions are not touched."
      confirmLabel="Delete"
      destructive
      isConfirming={busy}
      onConfirm={deleteLoan}
    />
    </>
  );
}

function SettleOption({ icon, title, hint, onClick, disabled }: { icon: React.ReactNode; title: string; hint: string; onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="flex w-full items-center gap-3 rounded-[16px] bg-surface px-3.5 py-3 text-left disabled:opacity-50">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent-hover">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-text-primary">{title}</span>
        <span className="block text-xs text-text-secondary">{hint}</span>
      </span>
    </button>
  );
}

function LoanOverview({ loan, onRemovePayment }: { loan: LoanSummary; onRemovePayment: (paymentId: string) => void }) {
  const openTransaction = useTransactionSheet((s) => s.open);
  const st = statusOf(loan);
  const s = loan.state;
  const interest = describeInterest(loan.interestRate, loan.interestPeriod);
  const rows: [string, string][] = [
    [loan.direction === "LENT" ? "Lent" : "Borrowed", `${formatMoney(loan.originalAmount, loan.currency)} on ${format(loan.startDate, "MMM d, yyyy")}`],
    [loan.direction === "LENT" ? "Return by" : "Repay by", format(loan.dueDate, "MMM d, yyyy")],
    ["Interest", interest ? `${interest}${loan.interestStoppedAt ? ` (stopped ${format(loan.interestStoppedAt, "MMM d")})` : ""}` : "None"],
  ];
  if (s.hasInterest) rows.push(["Interest so far", formatMoney(s.interestAccrued, loan.currency)]);
  rows.push(["Paid back", formatMoney(s.paidTotal, loan.currency)]);
  if (loan.rolledFrom) rows.push(["Carried over from", loan.rolledFrom.title]);

  return (
    <>
      <div className="rounded-[22px] px-5 py-5 text-center" style={{ background: "var(--hero-gradient)" }}>
        <p className="text-sm font-semibold text-hero-text-secondary">
          {s.status === "OPEN" ? "Owed now" : s.status === "SETTLED" ? "Settled" : s.status === "WAIVED" ? "Waived" : "Moved to a new loan"}
        </p>
        <p className="mt-1 font-numeric text-[2.5rem] font-extrabold leading-none tracking-[-1.5px] text-hero-text">
          {formatMoney(s.status === "OPEN" ? s.outstanding : s.status === "SETTLED" ? 0 : s.closedAmount, loan.currency)}
        </p>
        <div className="mt-2 flex justify-center">
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>
        {s.status === "OPEN" && s.interestPerDay > 0 && <p className="mt-2 text-xs font-semibold text-hero-text-secondary">Grows by about {formatMoney(s.interestPerDay, loan.currency)} a day</p>}
        {s.status === "OPEN" && s.hasInterest && (
          <p className="mt-1 text-xs font-semibold text-hero-text-secondary">
            {formatMoney(s.principalOutstanding, loan.currency)} + {formatMoney(s.interestOutstanding, loan.currency)} interest
          </p>
        )}
      </div>

      <dl className="overflow-hidden rounded-[22px] bg-surface-2">
        {rows.map(([k, v], i) => (
          <div key={k} className={cn("flex items-center justify-between gap-3 px-4 py-3 text-sm", i < rows.length - 1 && "border-b border-divider")}>
            <dt className="font-semibold text-text-secondary">{k}</dt>
            <dd className="truncate text-right font-bold text-text-primary">{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">History</p>
        <ol className="space-y-2">
          {s.events.map((e, i) => {
            const payment = e.kind === "PAYMENT" ? loan.paymentDetails.find((p) => p.key === e.transactionId) : undefined;
            const body = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-text-primary">{eventLabel(e, loan.direction)}</span>
                  <span className="block text-xs text-text-secondary">
                    {format(e.date, "MMM d, yyyy")}
                    {payment?.manual ? ` · Outside Spent${payment.note ? ` · ${payment.note}` : ""}` : ""}
                    {e.kind === "PAYMENT" && s.hasInterest ? ` · ${formatMoney(e.toInterest, loan.currency)} interest, ${formatMoney(e.toPrincipal, loan.currency)} amount` : ""}
                  </span>
                </span>
                {"amount" in e && (
                  <span className={cn("shrink-0 font-numeric text-sm font-extrabold", e.kind === "PAYMENT" ? "text-income" : "text-text-primary")}>
                    {e.kind === "PAYMENT" ? "+" : ""}
                    {formatMoney(e.amount, loan.currency)}
                  </span>
                )}
              </>
            );
            return (
              <li key={i}>
                {payment ? (
                  <button
                    type="button"
                    onClick={() => (payment.manual ? onRemovePayment(payment.paymentId) : openTransaction({ transactionId: payment.transactionId! }))}
                    className="flex w-full items-center gap-3 rounded-[16px] bg-surface-2 px-4 py-3 text-left"
                  >
                    {body}
                    {payment.manual && <Trash2 size={16} className="shrink-0 text-text-secondary" aria-label="Remove this payment" />}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-[16px] bg-surface-2 px-4 py-3">{body}</div>
                )}
              </li>
            );
          })}
          {s.hasInterest && s.status === "OPEN" && s.interestOutstanding > 0 && (
            <li className="flex items-center gap-3 rounded-[16px] bg-surface-2 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-text-primary">Interest owed today</span>
                <span className="block text-xs text-text-secondary">Calculated up to {format(new Date(), "MMM d, yyyy")}</span>
              </span>
              <span className="shrink-0 font-numeric text-sm font-extrabold text-text-primary">{formatMoney(s.interestOutstanding, loan.currency)}</span>
            </li>
          )}
        </ol>
      </div>
    </>
  );
}

function EditTerms({ loan, onCancel, onSaved }: { loan: LoanSummary; onCancel: () => void; onSaved: () => void }) {
  const standalone = loan.standalone;
  const [who, setWho] = useState(loan.title);
  const [amount, setAmount] = useState(String(loan.originalAmount / 10 ** decimalsForCurrency(loan.currency)));
  const [started, setStarted] = useState(format(loan.startDate, "yyyy-MM-dd"));
  const { attach, value: amountText, onChange: onAmountChange } = useAmountField(amount, setAmount, loan.currency);
  const [due, setDue] = useState(format(loan.dueDate, "yyyy-MM-dd"));
  const [interestOn, setInterestOn] = useState(!!loan.interestRate);
  const [rate, setRate] = useState(loan.interestRate ? String(loan.interestRate) : "");
  const [period, setPeriod] = useState<InterestPeriod>(loan.interestPeriod ?? "MONTH");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(undefined);
    if (interestOn && !(Number(rate) > 0)) {
      setError("Enter the interest rate");
      return;
    }
    setSaving(true);
    const result = await updateLoanTermsAction({
      loanId: loan.id,
      ...(standalone ? { title: who, amount: Number(amount), startDate: new Date(started) } : {}),
      dueDate: new Date(due),
      interestRate: interestOn ? Number(rate) : null,
      interestPeriod: interestOn ? period : null,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Loan updated");
    onSaved();
  }

  return (
    <div className="space-y-4">
      <Reveal show={standalone}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-who">{loan.direction === "LENT" ? "Lent to" : "Borrowed from"}</Label>
            <Input id="edit-who" value={who} onChange={(e) => setWho(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-amount">Amount</Label>
              <Input id="edit-amount" inputMode="decimal" ref={attach} value={amountText} onChange={onAmountChange} />
            </div>
            <div>
              <Label>{loan.direction === "LENT" ? "Given on" : "Taken on"}</Label>
              <DatePicker value={started} onChange={setStarted} />
            </div>
          </div>
        </div>
      </Reveal>
      <div>
        <Label>{loan.direction === "LENT" ? "Return by" : "Repay by"}</Label>
        <DatePicker value={due} onChange={setDue} />
      </div>
      <LoanInterestFields
        borrowed={loan.direction === "BORROWED"}
        enabled={interestOn}
        onEnabledChange={setInterestOn}
        rate={rate}
        onRateChange={setRate}
        period={period}
        onPeriodChange={setPeriod}
        amountMinor={loan.state.principalOutstanding || loan.originalAmount}
        currency={loan.currency}
        errors={{ loanRate: error ?? "" }}
      />
      <FieldError>{error}</FieldError>
      <p className="text-xs leading-relaxed text-text-secondary">Interest updates from the day the loan started.</p>
      <div className="flex gap-2.5">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" className="flex-1" onClick={save} loading={saving} loadingText="Saving…">
          Save
        </Button>
      </div>
    </div>
  );
}
