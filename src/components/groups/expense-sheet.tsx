"use client";

import { useMemo, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Receipt, Trash2, Wallet } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { DatePicker } from "@/components/ui/date-picker";
import { Reveal } from "@/components/ui/reveal";
import { Toggle } from "@/components/ui/toggle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createExpenseAction, deleteExpenseAction, updateExpenseAction } from "@/actions/split";
import { useAmountField } from "@/hooks/use-amount-field";
import { computeShares, type SplitType } from "@/lib/split";
import { decimalsForCurrency, formatMoney, toMinorUnits } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { GroupDetail, GroupExpenseView } from "@/lib/data/split";

export interface PickAccount {
  id: string;
  name: string;
  currency: string;
  type: string;
}
export interface PickCategory {
  id: string;
  name: string;
}
export interface FromTransaction {
  id: string;
  title: string;
  /** Minor units. */
  amount: number;
  date: Date;
}

const TYPES: { value: SplitType; label: string }[] = [
  { value: "EQUAL", label: "Equally" },
  { value: "EXACT", label: "Exact" },
  { value: "PERCENT", label: "Percent" },
  { value: "SHARES", label: "Shares" },
];

const toMajor = (minor: number, currency: string) => String(minor / 10 ** decimalsForCurrency(currency));

export function ExpenseSheet({
  open,
  onOpenChange,
  formKey,
  group,
  expense,
  fromTransaction,
  accounts,
  categories,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Changes every time the sheet opens, so each opening starts from a clean form. */
  formKey: number;
  group: GroupDetail;
  expense?: GroupExpenseView | null;
  fromTransaction?: FromTransaction | null;
  accounts: PickAccount[];
  categories: PickCategory[];
  onDone: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={expense ? "Edit expense" : "Add expense"} fill>
      <ExpenseForm
        key={`${formKey}:${expense?.id ?? fromTransaction?.id ?? "new"}`}
        group={group}
        expense={expense ?? null}
        fromTransaction={fromTransaction ?? null}
        accounts={accounts}
        categories={categories}
        onClose={() => onOpenChange(false)}
        onDone={onDone}
      />
    </Sheet>
  );
}

export function ExpenseForm({
  group,
  expense,
  fromTransaction,
  accounts,
  categories,
  onClose,
  onDone,
}: {
  group: GroupDetail;
  expense: GroupExpenseView | null;
  fromTransaction: FromTransaction | null;
  accounts: PickAccount[];
  categories: PickCategory[];
  onClose: () => void;
  onDone: () => void;
}) {
  const currency = group.currency;
  const active = group.members.filter((m) => !m.removed);
  const editing = !!expense;
  const linked = !!expense?.transactionId;
  const fixedTotal = !!fromTransaction;

  const [title, setTitle] = useState(expense?.title ?? fromTransaction?.title ?? "");
  const [amount, setAmount] = useState(expense ? toMajor(expense.total, currency) : fromTransaction ? toMajor(fromTransaction.amount, currency) : "");
  const { attach, value: amountText, onChange: onAmountChange } = useAmountField(amount, setAmount, currency);
  const [date, setDate] = useState(format(expense?.date ?? fromTransaction?.date ?? new Date(), "yyyy-MM-dd"));
  const [paidById, setPaidById] = useState(expense?.paidById ?? group.youId);
  const [type, setType] = useState<SplitType>(expense?.splitType ?? "EQUAL");
  const [included, setIncluded] = useState<Set<string>>(new Set(expense ? expense.shares.map((s) => s.memberId) : active.map((m) => m.id)));
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!expense) return {};
    const v: Record<string, string> = {};
    for (const s of expense.shares) v[s.memberId] = expense.splitType === "EXACT" ? toMajor(s.owed, currency) : expense.splitType === "EQUAL" ? "" : String(s.input ?? "");
    return v;
  });
  const [note, setNote] = useState(expense?.note ?? "");
  const matching = accounts.filter((a) => a.currency === currency);
  const [accountOn, setAccountOn] = useState(!editing && !fromTransaction && matching.length > 0);
  const [accountId, setAccountId] = useState(matching[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories.find((c) => /din|food|eat|restaurant/i.test(c.name))?.id ?? categories[0]?.id ?? "");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const youPay = paidById === group.youId;
  const totalMinor = fixedTotal ? fromTransaction!.amount : amount ? toMinorUnits(Number(amount), currency) : 0;

  const entries = useMemo(
    () =>
      active
        .filter((m) => included.has(m.id))
        .map((m) => {
          const raw = values[m.id];
          const n = raw === undefined || raw === "" ? 0 : Number(raw);
          return { memberId: m.id, value: type === "EXACT" ? toMinorUnits(n, currency) : type === "EQUAL" ? undefined : n };
        }),
    [active, included, values, type, currency],
  );
  const result = useMemo(() => (totalMinor > 0 ? computeShares(totalMinor, type, entries, paidById) : null), [totalMinor, type, entries, paidById]);
  const owedBy = new Map(result && result.ok ? result.shares.map((s) => [s.memberId, s.owed]) : []);
  const problem = result && !result.ok ? result.error : null;
  const assigned = type === "EXACT" ? entries.reduce((n, e) => n + (e.value ?? 0), 0) : 0;

  function toggle(id: string) {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev;
        next.delete(id);
      } else next.add(id);
      return next;
    });
  }

  function chooseType(next: SplitType) {
    setType(next);
    setError(undefined);
    const ids = active.filter((m) => included.has(m.id)).map((m) => m.id);
    if (next === "PERCENT") {
      const base = Math.floor(10000 / ids.length) / 100;
      setValues(Object.fromEntries(ids.map((id, i) => [id, i === ids.length - 1 ? String(Math.round((100 - base * (ids.length - 1)) * 100) / 100) : String(base)])));
    } else if (next === "SHARES") setValues(Object.fromEntries(ids.map((id) => [id, "1"])));
    else setValues({});
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!title.trim()) return setError("Enter what it was for");
    if (!(totalMinor > 0)) return setError("Enter an amount above 0");
    if (problem) return setError(problem);
    setSaving(true);
    const payload = {
      groupId: group.id,
      title,
      amount: Number(amount || 0),
      date: new Date(date),
      paidById,
      splitType: type,
      entries: entries.map((en) => ({ memberId: en.memberId, value: type === "EXACT" ? Number(values[en.memberId] || 0) : en.value })),
      note: note.trim() || undefined,
    };
    const res = expense
      ? await updateExpenseAction(expense.id, payload)
      : await createExpenseAction({
          ...payload,
          fromTransactionId: fromTransaction?.id,
          ...(accountOn && youPay && !fromTransaction ? { accountId, categoryId } : {}),
        });
    setSaving(false);
    if (res.error) return setError(res.error);
    toast.success(editing ? "Expense updated" : "Expense added");
    onClose();
    onDone();
  }

  async function remove() {
    if (!expense) return;
    setDeleting(true);
    const res = await deleteExpenseAction(expense.id);
    setDeleting(false);
    setConfirmDelete(false);
    if (res.error) return toast.error(res.error);
    toast.success("Expense deleted");
    onClose();
    onDone();
  }

  const hint =
    type === "EQUAL" && result?.ok && totalMinor > 0
      ? (() => {
          const amounts = [...new Set(result.shares.map((s) => s.owed))];
          return amounts.length === 1 ? `Each owes ${formatMoney(amounts[0], currency)}` : `About ${formatMoney(Math.floor(totalMinor / result.shares.length), currency)} each, the extra paise go to the payer first`;
        })()
      : type === "EXACT" && totalMinor > 0
        ? assigned === totalMinor
          ? "All of it is assigned"
          : `${formatMoney(Math.abs(totalMinor - assigned), currency)} ${totalMinor > assigned ? "left to assign" : "too much"}`
        : type === "PERCENT"
          ? `${Math.round(entries.reduce((n, en) => n + (en.value ?? 0), 0) * 100) / 100}% of 100%`
          : null;

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 pb-4 pt-4">
        <div>
          <Label htmlFor="ex-title">What was it for</Label>
          <Input id="ex-title" placeholder="e.g. Dinner" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ex-amount">Amount ({currency})</Label>
            <Input id="ex-amount" inputMode="decimal" placeholder="0.00" ref={attach} value={amountText} onChange={onAmountChange} disabled={fixedTotal} />
          </div>
          <div>
            <Label>Date</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>
        </div>

        <div>
          <Label>Paid by</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {active.map((m) => (
              <Chip key={m.id} selected={paidById === m.id} disabled={fixedTotal || linked} onClick={() => setPaidById(m.id)}>
                {m.name}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <Label>Split</Label>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {TYPES.map((t) => (
              <Chip key={t.value} selected={type === t.value} className="w-full min-w-0 justify-center px-1" onClick={() => chooseType(t.value)}>
                {t.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[22px] bg-surface-2">
          {active.map((m, i) => {
            const on = included.has(m.id);
            const owed = owedBy.get(m.id);
            return (
              <div key={m.id} className={cn("flex items-center gap-3 px-4 py-2.5", i > 0 && "border-t border-divider")}>
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`${m.name} is in this`}
                  onClick={() => toggle(m.id)}
                  className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] border-2 text-xs font-extrabold transition-colors", on ? "border-accent bg-accent text-text-on-accent" : "border-border-strong bg-surface text-transparent")}
                >
                  ✓
                </button>
                <span className={cn("min-w-0 flex-1 truncate text-[0.9375rem] font-bold", on ? "text-text-primary" : "text-text-secondary")}>{m.name}</span>
                {on && type !== "EQUAL" && (
                  <Input
                    aria-label={`${m.name}: ${type === "EXACT" ? "amount" : type === "PERCENT" ? "percent" : "shares"}`}
                    inputMode="decimal"
                    className="h-10 w-24 text-right"
                    placeholder={type === "EXACT" ? "0.00" : type === "PERCENT" ? "%" : "1"}
                    value={values[m.id] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [m.id]: e.target.value.replace(/[^0-9.]/g, "") }))}
                  />
                )}
                {on && type !== "EXACT" && owed !== undefined && <span className="w-24 shrink-0 text-right font-numeric text-sm font-extrabold text-text-primary">{formatMoney(owed, currency)}</span>}
              </div>
            );
          })}
        </div>
        {hint && <p className={cn("-mt-2 text-xs font-semibold", problem && type !== "EQUAL" ? "text-text-secondary" : "text-text-secondary")}>{hint}</p>}

        {!editing && !fromTransaction && matching.length > 0 && (
          <Reveal show={youPay}>
            <div className="rounded-[22px] bg-surface-2 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-surface text-accent-hover">
                  <Wallet size={20} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] font-extrabold text-text-primary">Take it from my account</p>
                  <p className="text-xs font-medium text-text-secondary">Only your share counts as spending.</p>
                </div>
                <Toggle checked={accountOn} onCheckedChange={setAccountOn} label="Take it from my account" />
              </div>
              <Reveal show={accountOn}>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger aria-label="Account">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {matching.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger aria-label="Category for your share">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Reveal>
            </div>
          </Reveal>
        )}
        {(linked || fromTransaction) && (
          <p className="flex items-center gap-2 rounded-[18px] bg-surface-2 px-4 py-3 text-[0.8125rem] font-semibold text-text-secondary">
            <Wallet size={16} className="shrink-0 text-accent-hover" />
            Paid from your account. Your share is the spending.
          </p>
        )}

        <div>
          <Label htmlFor="ex-note">Note (optional)</Label>
          <Input id="ex-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <FieldError>{error}</FieldError>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-divider bg-bg px-6 pb-[calc(0.875rem+env(safe-area-inset-bottom))] pt-3">
        {editing && (
          <Button type="button" variant="secondary" size="lg" aria-label="Delete expense" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={18} strokeWidth={2} />
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-1" loading={saving} loadingText="Saving…">
          <Receipt size={18} strokeWidth={2} />
          {editing ? "Save changes" : "Add expense"}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this expense?"
        description={linked ? "It is removed from the group and from your account, and balances go back." : "It is removed from the group and balances go back."}
        confirmLabel="Delete"
        destructive
        isConfirming={deleting}
        onConfirm={remove}
      />
    </form>
  );
}
