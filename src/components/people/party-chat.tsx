"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import {
  Bell,
  BellOff,
  CheckCheck,
  Clock,
  Ellipsis,
  GitMerge,
  MessageCircle,
  Pin,
  PinOff,
  Plus,
  Minus,
  Share2,
  Store,
  Undo2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { BackHeader } from "@/components/layout/back-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Sheet } from "@/components/ui/sheet";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { markAllSquareAction, mergePartiesAction, setPartyPrefsAction, unmergePartyAction } from "@/actions/parties";
import { useTransactionSheet } from "@/stores/ui-store";
import { describeInterest, type InterestPeriod } from "@/lib/loan-math";
import { decimalsForCurrency, formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PartyMessage, PartyThread } from "@/lib/data/parties";

const dayKey = (iso: string) => format(new Date(iso), "yyyy-MM-dd");

/** "₹2,000" for a round amount, "₹14,225.50" when there are minor units: bubbles read better without needless zeros. */
function wholeOrExact(amount: number, currency: string) {
  const unit = 10 ** decimalsForCurrency(currency);
  return formatMoney(amount, currency, undefined, amount % unit === 0 ? { decimals: 0 } : undefined);
}

function Tag({ children, tone }: { children: React.ReactNode; tone: "onGreen" | "green" | "gray" | "amber" }) {
  return (
    <span
      className={cn(
        "mb-1 inline-block rounded-full px-2 py-0.5 text-[0.625rem] font-extrabold uppercase tracking-wide",
        tone === "onGreen" && "bg-white/20 text-text-on-accent",
        tone === "green" && "bg-accent-subtle text-accent-text",
        tone === "gray" && "bg-surface-3 text-text-secondary",
        tone === "amber" && "bg-warning-subtle text-warning",
      )}
    >
      {children}
    </span>
  );
}

/** One payment as a chat bubble: money that left you on the right, money that came to you on the left. */
function Bubble({ m, person, firstName, onOpen }: { m: PartyMessage; person: boolean; firstName: string; onOpen: () => void }) {
  const out = m.direction === "OUT";
  const loan = m.loan;
  const interest = loan ? describeInterest(loan.interestRate, loan.interestPeriod as InterestPeriod | null) : null;
  const upcoming = m.status === "UPCOMING";

  // Visual kind: a loan or a repayment gets the strong styles; a plain gift/payment is dashed grey.
  const plain = m.kind === "GIVEN" || m.kind === "RECEIVED";
  const dashed = person && plain;

  let tag: React.ReactNode = null;
  if (m.kind === "LOAN_GIVEN" && loan) tag = <Tag tone="onGreen">Loan, return by {format(new Date(loan.dueDate), "MMM d")}</Tag>;
  else if (m.kind === "LOAN_TAKEN" && loan) tag = <Tag tone="green">You borrowed, repay by {format(new Date(loan.dueDate), "MMM d")}</Tag>;
  else if (m.kind === "REPAY_IN" || m.kind === "REPAY_OUT") tag = <Tag tone={out ? "onGreen" : "green"}>Repayment</Tag>;
  else if (dashed) tag = <Tag tone="gray">{out ? "Gift or payment" : "Received"}</Tag>;

  const who = out ? "You gave" : `${firstName} gave you`;
  const lead =
    m.kind === "LOAN_GIVEN" ? "You lent" : m.kind === "LOAN_TAKEN" ? `${firstName} lent you` : m.kind === "REPAY_IN" ? `${firstName} paid back` : m.kind === "REPAY_OUT" ? "You paid back" : person ? who : out ? "You paid" : "Refund";

  const meta: string[] = [];
  if (m.splits.length > 0 && m.splits.some((s) => s.toInterest > 0)) {
    const interestPart = m.splits.reduce((n, s) => n + s.toInterest, 0);
    const principalPart = m.splits.reduce((n, s) => n + s.toPrincipal, 0);
    meta.push(`${formatMoney(interestPart, m.currency)} interest + ${formatMoney(principalPart, m.currency)} off the loan`);
  } else if (m.splits.length > 0) {
    meta.push("All of it off the loan");
  }
  if (m.splits.some((s) => s.settled)) meta.push("Loan settled");
  if (loan && (m.kind === "LOAN_GIVEN" || m.kind === "LOAN_TAKEN")) {
    meta.push(interest ? `${interest}${loan.state.interestPerDay > 0 ? `, adds about ${formatMoney(loan.state.interestPerDay, loan.currency)} a day` : ""}` : "No interest");
    if (loan.state.status === "SETTLED") meta.push("Settled");
    if (loan.state.status === "WAIVED") meta.push("Waived");
    if (loan.state.status === "ROLLED_OVER") meta.push("Moved to a new loan");
  }
  if (m.note) meta.push(m.note);

  const green = out && !dashed;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "mb-2 block max-w-[80%] rounded-[20px] px-3.5 py-2.5 text-left transition-transform active:scale-[0.98]",
        out ? "ml-auto rounded-br-[6px]" : "mr-auto rounded-bl-[6px]",
        green && "bg-accent text-text-on-accent",
        dashed && out && "border border-dashed border-border-strong bg-surface-2 text-text-primary",
        !out && "border border-divider bg-surface text-text-primary",
      )}
    >
      {tag}
      {upcoming && (
        <span className="mb-1 ml-1 inline-flex items-center gap-1 text-[0.6875rem] font-bold opacity-80">
          <Clock size={11} /> Upcoming
        </span>
      )}
      <span className={cn("block text-xl font-extrabold tracking-tight", !out && m.kind !== "REPAY_IN" && m.kind !== "RECEIVED" ? "text-expense" : !out ? "text-income" : "")}>
        {!out && (m.kind === "REPAY_IN" || m.kind === "RECEIVED") ? "+" : ""}
        {wholeOrExact(m.amount, m.currency)}
      </span>
      <span className="block text-sm">
        {lead} · {m.accountName}
      </span>
      {meta.map((line, i) => (
        <span key={i} className="mt-0.5 block text-xs font-semibold opacity-80">
          {line}
        </span>
      ))}
    </button>
  );
}

function MenuItem({ icon: Icon, label, onClick, busy, danger }: { icon: typeof Bell; label: string; onClick: () => void; busy: boolean; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} className="flex w-full items-center gap-3.5 border-b border-divider px-1 py-3.5 text-left last:border-b-0 disabled:opacity-60">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]", danger ? "bg-error-subtle text-error" : "bg-surface-2 text-text-primary")}>
        <Icon size={20} strokeWidth={2} />
      </span>
      <span className={cn("flex-1 text-[0.9375rem] font-bold", danger ? "text-error" : "text-text-primary")}>{label}</span>
    </button>
  );
}

export function PartyChat({ thread, others }: { thread: PartyThread; others: { key: string; name: string }[] }) {
  const router = useRouter();
  const openTransaction = useTransactionSheet((s) => s.open);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeInto, setMergeInto] = useState<string | null>(null);
  const [confirmSquare, setConfirmSquare] = useState(false);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const person = thread.kind === "PERSON";
  const firstName = thread.name.split(/\s+/)[0] ?? thread.name;
  const currency = thread.currency;
  const s = thread.summary;
  const hasOpen = s.openLoanCount > 0;

  // Newest at the bottom, like a chat: land there.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.messages.length]);

  const days = useMemo(() => {
    const groups: { key: string; label: string; items: PartyMessage[] }[] = [];
    for (const m of thread.messages) {
      const k = dayKey(m.date);
      let g = groups[groups.length - 1];
      if (!g || g.key !== k) {
        g = { key: k, label: format(new Date(m.date), "MMM d").toUpperCase(), items: [] };
        groups.push(g);
      }
      g.items.push(m);
    }
    return groups;
  }, [thread.messages]);

  const loansCount = thread.messages.filter((m) => m.kind === "LOAN_GIVEN" || m.kind === "LOAN_TAKEN").length;
  const subtitle = person
    ? [loansCount > 0 && `${loansCount} ${loansCount === 1 ? "loan" : "loans"}`, s.since && `since ${format(new Date(s.since), "MMM d")}`].filter(Boolean).join(" · ")
    : `${s.count} ${s.count === 1 ? "payment" : "payments"}${s.since ? ` · since ${format(new Date(s.since), "MMM d")}` : ""}`;

  async function run(task: () => Promise<{ error?: string }>, success?: string) {
    setBusy(true);
    const result = await task();
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    if (success) toast.success(success);
    router.refresh();
    return true;
  }

  const summaryText = [
    `${thread.name} on Spent.`,
    s.owedToYou > 0 ? `${thread.name} owes me ${formatMoney(s.owedToYou, currency)}${s.interestOutstanding > 0 ? ` (${formatMoney(s.principalOutstanding, currency)} + ${formatMoney(s.interestOutstanding, currency)} interest)` : ""}.` : null,
    s.youOwe > 0 ? `I owe ${thread.name} ${formatMoney(s.youOwe, currency)}.` : null,
    s.nextDue ? `Due ${format(new Date(s.nextDue), "MMM d, yyyy")}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  async function share(text: string) {
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      return; // the person closed the share sheet
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied. Paste it into any chat.");
    } catch {
      toast.error("Could not share from this device");
    }
  }

  const reminderText = `Hi ${firstName}, a gentle reminder about the ${formatMoney(s.owedToYou, currency)} you owe me${s.nextDue ? `, due ${format(new Date(s.nextDue), "MMM d")}` : ""}. Thank you!`;

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <BackHeader
        href="/people"
        title={thread.name}
        action={
          <button
            type="button"
            aria-label="Chat options"
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
          >
            <Ellipsis size={22} />
          </button>
        }
      />
      <p className="truncate px-1 pb-3 text-[0.8125rem] text-text-secondary">{subtitle || "No payments yet"}</p>

      {/* The summary card */}
      {person ? (
        <div className="rounded-2xl px-5 py-4 text-hero-text" style={{ background: "var(--hero-gradient)" }}>
          {hasOpen && (s.owedToYou > 0 || s.youOwe > 0) ? (
            <>
              <p className="text-[0.8125rem] font-semibold text-hero-text-secondary">
                {s.owedToYou > 0 && s.youOwe > 0 ? "Net with " + firstName : s.owedToYou > 0 ? `${firstName} owes you (loans only)` : `You owe ${firstName} (loans only)`}
              </p>
              <p className="mt-0.5 text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em]">
                {s.owedToYou > 0 && s.youOwe > 0
                  ? `${s.owedToYou - s.youOwe >= 0 ? "+" : "-"}${formatMoney(Math.abs(s.owedToYou - s.youOwe), currency)}`
                  : formatMoney(s.owedToYou > 0 ? s.owedToYou : s.youOwe, currency)}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {s.interestOutstanding > 0 && (
                  <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold dark:bg-black/10">
                    {formatMoney(s.principalOutstanding, currency)} + {formatMoney(s.interestOutstanding, currency)} interest
                  </span>
                )}
                {s.interestRate ? (
                  <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold dark:bg-black/10">{describeInterest(s.interestRate, s.interestPeriod as InterestPeriod | null)}</span>
                ) : s.interestOutstanding === 0 ? (
                  <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold dark:bg-black/10">No interest</span>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="text-[0.8125rem] font-semibold text-hero-text-secondary">Loans with {firstName}</p>
              <p className="mt-0.5 text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em]">All square</p>
              <p className="mt-1 text-xs font-semibold text-hero-text-secondary">Nothing owed either way. Gifts and ordinary payments are never counted.</p>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-2xl px-5 py-4 text-hero-text" style={{ background: "var(--hero-gradient)" }}>
          <p className="text-[0.8125rem] font-semibold text-hero-text-secondary">This month</p>
          <p className="mt-0.5 text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em]">{formatMoney(s.monthSpend, currency)}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {s.monthCount > 0 && <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold dark:bg-black/10">avg {formatMoney(s.avgPerPayment, currency)} a payment</span>}
            <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold dark:bg-black/10">Last month {formatMoney(s.lastMonthSpend, currency)}</span>
          </div>
        </div>
      )}

      {/* Reminder banners, one per open loan */}
      {person &&
        thread.reminders.map((r) => {
          const due = new Date(r.dueDate);
          const days = differenceInCalendarDays(due, startOfDay(new Date()));
          return (
            <div
              key={r.loanId}
              className={cn("mt-3 flex items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-[0.8125rem] font-semibold", r.overdue ? "bg-error-subtle text-error" : "bg-warning-subtle text-warning")}
            >
              {thread.muted ? <BellOff size={18} className="shrink-0" /> : <Bell size={18} className="shrink-0" />}
              <span className="min-w-0 flex-1">
                {r.overdue
                  ? `${r.direction === "LENT" ? "Was due back" : "Was due to repay"} ${format(due, "MMM d")}. ${r.daysLate} ${r.daysLate === 1 ? "day" : "days"} late.`
                  : `${r.direction === "LENT" ? "Due back" : "Repay by"} ${format(due, "MMM d")}, ${days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}.`}{" "}
                {thread.muted ? "Reminders muted." : "Reminder the day before."}
              </span>
            </div>
          );
        })}

      {/* Messages */}
      <div className="mt-2 flex-1 pb-28">
        {days.length === 0 && <p className="py-10 text-center text-sm text-text-secondary">No payments yet.</p>}
        {days.map((g) => (
          <div key={g.key}>
            <p className="my-3 text-center text-xs font-bold tracking-wide text-text-secondary">{g.label}</p>
            {g.items.map((m) => (
              <Bubble key={m.id} m={m} person={person} firstName={firstName} onOpen={() => openTransaction({ transactionId: m.id })} />
            ))}
          </div>
        ))}
        {person && !thread.muted && thread.reminders.filter((r) => !r.overdue).map((r) => {
          const due = new Date(r.dueDate);
          const remind = new Date(r.remindOn);
          return (
            <p key={`n${r.loanId}`} className="mx-auto mt-2 w-fit max-w-[92%] rounded-2xl bg-warning-subtle px-4 py-2 text-center text-xs font-bold text-warning">
              Reminder set for {format(remind, "MMM d")}: {r.direction === "LENT" ? `${thread.name}'s ${formatMoney(r.outstanding, r.currency)} is due back ${format(due, "MMM d")}` : `repay ${thread.name} ${formatMoney(r.outstanding, r.currency)} by ${format(due, "MMM d")}`}
            </p>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-divider bg-bg px-4 pt-3 pb-[calc(0.875rem+env(safe-area-inset-bottom))] md:static md:z-auto md:border-t-0 md:px-0 md:pb-0">
        <div className={cn("mx-auto grid max-w-2xl gap-2.5", person ? "grid-cols-2" : "grid-cols-1")}>
          {person ? (
            <>
              <Button type="button" variant="secondary" size="lg" className="rounded-full px-3" onClick={() => openTransaction({ type: "EXPENSE", party: { name: thread.name, person: true } })}>
                <Minus size={18} strokeWidth={2.5} />
                I gave
              </Button>
              <Button type="button" size="lg" className="rounded-full px-3" onClick={() => openTransaction({ type: "INCOME", party: { name: thread.name, person: true } })}>
                <Plus size={18} strokeWidth={2.5} />
                <span className="truncate">{firstName} gave</span>
              </Button>
            </>
          ) : (
            <Button type="button" size="lg" className="rounded-full" onClick={() => openTransaction({ type: "EXPENSE", party: { name: thread.name, person: false } })}>
              <Plus size={18} strokeWidth={2.5} />
              Add another payment
            </Button>
          )}
        </div>
      </div>

      {/* Chat options */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title={thread.name}>
        <div className="pb-2">
          {s.owedToYou > 0 && (
            <MenuItem
            busy={busy}
              icon={MessageCircle}
              label="Send a gentle reminder"
              onClick={() => {
                setMenuOpen(false);
                void share(reminderText);
              }}
            />
          )}
          <MenuItem
            busy={busy}
            icon={Share2}
            label="Share a summary"
            onClick={() => {
              setMenuOpen(false);
              void share(summaryText);
            }}
          />
          {hasOpen && (
            <MenuItem
            busy={busy}
              icon={thread.muted ? Bell : BellOff}
              label={thread.muted ? `Turn reminders back on` : `Mute reminders for ${firstName}`}
              onClick={async () => {
                if (await run(() => setPartyPrefsAction(thread.key, { muted: !thread.muted }), thread.muted ? "Reminders are on again" : "Reminders muted")) setMenuOpen(false);
              }}
            />
          )}
          {hasOpen && (
            <MenuItem
            busy={busy}
              icon={CheckCheck}
              label="Mark all square (waive the rest)"
              onClick={() => {
                setMenuOpen(false);
                setConfirmSquare(true);
              }}
            />
          )}
          <MenuItem
            busy={busy}
            icon={GitMerge}
            label="Merge with another name"
            onClick={() => {
              setMenuOpen(false);
              setMergeOpen(true);
            }}
          />
          {thread.mergedNames.map((n) => (
            <MenuItem
            busy={busy}
              key={n.key}
              icon={Undo2}
              label={`Separate out "${n.name}"`}
              onClick={async () => {
                if (await run(() => unmergePartyAction(n.key), `"${n.name}" is its own chat again`)) setMenuOpen(false);
              }}
            />
          ))}
          <MenuItem
            busy={busy}
            icon={thread.pinned ? PinOff : Pin}
            label={thread.pinned ? "Unpin this chat" : "Pin this chat"}
            onClick={async () => {
              if (await run(() => setPartyPrefsAction(thread.key, { pinned: !thread.pinned }))) setMenuOpen(false);
            }}
          />
          <MenuItem
            busy={busy}
            icon={person ? Store : User}
            label={person ? "Treat as a shop" : "Treat as a person"}
            onClick={async () => {
              if (await run(() => setPartyPrefsAction(thread.key, { kind: person ? "MERCHANT" : "PERSON" }), person ? "Now listed under shops" : "Now listed under people")) setMenuOpen(false);
            }}
          />
        </div>
      </Sheet>

      {/* Merge with another name */}
      <Sheet open={mergeOpen} onOpenChange={setMergeOpen} title="Merge with another name">
        <div className="space-y-4 pb-2">
          <p className="text-sm text-text-secondary">
            Choose the name that is really the same {person ? "person" : "shop"}. Its payments move into this chat. Nothing is renamed, and you can separate it again.
          </p>
          <SearchableSelect
            value={mergeInto}
            onChange={setMergeInto}
            options={others.map((o) => ({ value: o.key, label: o.name }))}
            placeholder="Choose a name"
            searchPlaceholder="Search names"
          />
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!mergeInto}
            loading={busy}
            loadingText="Merging…"
            onClick={async () => {
              if (!mergeInto) return;
              if (await run(() => mergePartiesAction(mergeInto, thread.key), "Merged into one chat")) {
                setMergeOpen(false);
                setMergeInto(null);
              }
            }}
          >
            Merge into {thread.name}
          </Button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmSquare}
        onOpenChange={setConfirmSquare}
        title={`Mark all square with ${firstName}?`}
        description={`This waives what is still owed (${formatMoney(s.owedToYou + s.youOwe, currency)}) and closes the open ${s.openLoanCount === 1 ? "loan" : "loans"}. The history stays, and you can reopen a loan from the Loans page.`}
        confirmLabel="Mark all square"
        isConfirming={busy}
        onConfirm={async () => {
          if (await run(() => markAllSquareAction(thread.key), "All square")) setConfirmSquare(false);
        }}
      />
    </div>
  );
}
