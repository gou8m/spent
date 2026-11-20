"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Archive, ArchiveRestore, ArrowRight, Ellipsis, HandCoins, Plus, Receipt, Trash2, UserMinus, UserPlus } from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SlidingTabs } from "@/components/ui/sliding-tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PartyAvatar } from "@/components/people/party-avatar";
import { ExpenseSheet, type PickAccount, type PickCategory } from "@/components/groups/expense-sheet";
import { SettleSheet, type SettlePrefill } from "@/components/groups/settle-sheet";
import { addMemberAction, deleteGroupAction, deleteSettlementAction, removeMemberAction, renameGroupAction, setGroupArchivedAction } from "@/actions/split";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { GroupDetail, GroupExpenseView, GroupSettlementView } from "@/lib/data/split";

type Tab = "expenses" | "balances";

type FeedItem = { kind: "expense"; at: number; created: number; expense: GroupExpenseView } | { kind: "settlement"; at: number; created: number; settlement: GroupSettlementView };

export function GroupView({ group, accounts, categories }: { group: GroupDetail; accounts: PickAccount[]; categories: PickCategory[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("expenses");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseKey, setExpenseKey] = useState(0);
  const [editing, setEditing] = useState<GroupExpenseView | null>(null);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleKey, setSettleKey] = useState(0);
  const [prefill, setPrefill] = useState<SettlePrefill | null>(null);
  const [manage, setManage] = useState(false);
  const [removeSettlement, setRemoveSettlement] = useState<GroupSettlementView | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => router.refresh();
  const cur = group.currency;
  const active = group.members.filter((m) => !m.removed);

  const yourShareTotal = group.expenses.reduce((n, e) => n + e.yourShare, 0);
  const feed = useMemo<FeedItem[]>(
    () =>
      [
        ...group.expenses.map((expense): FeedItem => ({ kind: "expense", at: new Date(expense.date).getTime(), created: 0, expense })),
        ...group.settlements.map((settlement): FeedItem => ({ kind: "settlement", at: new Date(settlement.date).getTime(), created: 0, settlement })),
      ].sort((a, b) => b.at - a.at),
    [group.expenses, group.settlements],
  );

  function openAdd() {
    setEditing(null);
    setExpenseKey((k) => k + 1);
    setExpenseOpen(true);
  }
  function openEdit(e: GroupExpenseView) {
    setEditing(e);
    setExpenseKey((k) => k + 1);
    setExpenseOpen(true);
  }
  function openSettle(p: SettlePrefill | null) {
    setPrefill(p);
    setSettleKey((k) => k + 1);
    setSettleOpen(true);
  }

  async function deleteSettlement() {
    if (!removeSettlement) return;
    setBusy(true);
    const res = await deleteSettlementAction(removeSettlement.id);
    setBusy(false);
    setRemoveSettlement(null);
    if (res.error) return toast.error(res.error);
    toast.success("Payment removed");
    refresh();
  }

  const net = group.youNet;
  return (
    <div className="space-y-4">
      <BackHeader
        href="/groups"
        title={group.name}
        action={
          <button
            type="button"
            aria-label="Group options"
            onClick={() => setManage(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
          >
            <Ellipsis size={22} />
          </button>
        }
      />

      <div className="rounded-2xl px-6 py-5 text-hero-text" style={{ background: "var(--hero-gradient)" }}>
        <p className="text-[0.9375rem] font-semibold text-hero-text-secondary">{net > 0 ? "You are owed" : net < 0 ? "You owe" : group.expenses.length ? "All settled up" : "Nothing yet"}</p>
        <p className="mt-1 text-[2rem] font-extrabold leading-tight tracking-[-0.03em]">{net === 0 ? formatMoney(0, cur) : formatMoney(Math.abs(net), cur)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <span className="flex flex-col items-center rounded-2xl bg-white/20 px-3 py-2 dark:bg-black/10">
            <span className="text-[0.6875rem] font-semibold text-hero-text-secondary">Group spent</span>
            <span className="text-[0.9375rem] font-extrabold">{formatMoney(group.totalSpent, cur, undefined, { decimals: 0 })}</span>
          </span>
          <span className="flex flex-col items-center rounded-2xl bg-white/20 px-3 py-2 dark:bg-black/10">
            <span className="text-[0.6875rem] font-semibold text-hero-text-secondary">Your share</span>
            <span className="text-[0.9375rem] font-extrabold">{formatMoney(yourShareTotal, cur, undefined, { decimals: 0 })}</span>
          </span>
        </div>
      </div>

      {!group.archived && (
        <div className="grid grid-cols-2 gap-2.5">
          <Button type="button" size="lg" className="min-w-0 px-3 whitespace-nowrap" onClick={openAdd}>
            <Plus size={18} strokeWidth={2.25} />
            Add expense
          </Button>
          <Button type="button" size="lg" variant="secondary" className="min-w-0 px-3 whitespace-nowrap" onClick={() => openSettle(null)} disabled={active.length < 2}>
            <HandCoins size={18} strokeWidth={2} />
            Settle up
          </Button>
        </div>
      )}
      {group.archived && <p className="rounded-[18px] bg-surface-2 px-4 py-3 text-[0.8125rem] font-semibold text-text-secondary">This group is archived. Restore it from the menu to add to it.</p>}

      <SlidingTabs
        options={[
          { value: "expenses" as Tab, label: "Expenses" },
          { value: "balances" as Tab, label: "Balances" },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div key={tab} className="animate-fade-up">
        {tab === "expenses" ? (
          feed.length === 0 ? (
            <EmptyState icon={Receipt} title="No expenses yet" description="Add the first one and everyone's share is worked out." />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {feed.map((item) =>
                item.kind === "expense" ? (
                  <li key={`e${item.expense.id}`}>
                    <ExpenseCard expense={item.expense} currency={cur} onOpen={() => !group.archived && openEdit(item.expense)} />
                  </li>
                ) : (
                  <li key={`s${item.settlement.id}`}>
                    <button
                      type="button"
                      onClick={() => !group.archived && setRemoveSettlement(item.settlement)}
                      className="flex w-full items-center gap-3 rounded-[22px] bg-accent-subtle px-4 py-3.5 text-left"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface text-accent-hover">
                        <HandCoins size={20} strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9375rem] font-bold text-text-primary">
                          {item.settlement.fromName} paid {item.settlement.toName}
                        </span>
                        <span className="block text-xs text-text-secondary">
                          {format(new Date(item.settlement.date), "MMM d, yyyy")}
                          {item.settlement.note ? ` · ${item.settlement.note}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 font-numeric text-[0.9375rem] font-extrabold text-accent-hover">{formatMoney(item.settlement.amount, cur)}</span>
                    </button>
                  </li>
                ),
              )}
            </ul>
          )
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[22px] bg-surface-2">
              {active.map((m, i) => (
                <div key={m.id} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-divider")}>
                  <PartyAvatar name={m.name} keyName={m.id} size={40} />
                  <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-bold text-text-primary">{m.name}</span>
                  <span className={cn("shrink-0 text-right text-sm font-extrabold", m.net > 0 ? "text-income" : m.net < 0 ? "text-expense" : "text-text-secondary")}>
                    {m.net > 0 ? `gets back ${formatMoney(m.net, cur)}` : m.net < 0 ? `owes ${formatMoney(-m.net, cur)}` : "settled"}
                  </span>
                </div>
              ))}
            </div>

            {group.transfers.length > 0 && (
              <section>
                <h2 className="mb-2.5 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Fewest payments to settle</h2>
                <div className="flex flex-col gap-2.5">
                  {group.transfers.map((t) => (
                    <div key={`${t.from}:${t.to}`} className="flex items-center gap-3 rounded-[22px] bg-surface-2 px-4 py-3">
                      <span className="min-w-0 flex-1 text-sm font-bold text-text-primary">
                        <span className="inline-flex items-center gap-1.5">
                          {t.fromName}
                          <ArrowRight size={14} className="text-text-secondary" />
                          {t.toName}
                        </span>
                        <span className="block font-numeric text-base font-extrabold">{formatMoney(t.amount, cur)}</span>
                      </span>
                      {!group.archived && (
                        <Button type="button" size="sm" variant="secondary" onClick={() => openSettle({ from: t.from, to: t.to, amount: t.amount })}>
                          Record
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {group.transfers.length === 0 && group.expenses.length > 0 && <p className="text-center text-sm font-semibold text-text-secondary">Everyone is square.</p>}
          </div>
        )}
      </div>

      <ExpenseSheet
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        formKey={expenseKey}
        group={group}
        expense={editing}
        accounts={accounts}
        categories={categories}
        onDone={refresh}
      />
      <SettleSheet open={settleOpen} onOpenChange={setSettleOpen} formKey={settleKey} group={group} prefill={prefill} onDone={refresh} />
      <ManageSheet open={manage} onOpenChange={setManage} group={group} onDone={refresh} />

      <ConfirmDialog
        open={!!removeSettlement}
        onOpenChange={(o) => !o && setRemoveSettlement(null)}
        title="Remove this payment?"
        description={removeSettlement ? `${removeSettlement.fromName} paid ${removeSettlement.toName} ${formatMoney(removeSettlement.amount, cur)}. Balances go back.` : ""}
        confirmLabel="Remove"
        destructive
        isConfirming={busy}
        onConfirm={deleteSettlement}
      />
    </div>
  );
}

function ExpenseCard({ expense, currency, onOpen }: { expense: GroupExpenseView; currency: string; onOpen: () => void }) {
  const n = expense.yourNet;
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-[22px] bg-surface-2 px-4 py-3.5 text-left transition-colors hover:bg-surface-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface text-accent-hover">
        <Receipt size={20} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-bold text-text-primary">{expense.title}</span>
        <span className="block truncate text-xs text-text-secondary">
          {expense.paidByName} paid {formatMoney(expense.total, currency)} · {format(new Date(expense.date), "MMM d")}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[0.6875rem] font-semibold text-text-secondary">{n > 0 ? "You lent" : n < 0 ? "You owe" : expense.yourShare === 0 ? "Not in it" : "Even"}</span>
        {n !== 0 && <span className={cn("block font-numeric text-[0.9375rem] font-extrabold", n > 0 ? "text-income" : "text-expense")}>{formatMoney(Math.abs(n), currency)}</span>}
      </span>
    </button>
  );
}

function ManageSheet({ open, onOpenChange, group, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; group: GroupDetail; onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(group.name);
  const [person, setPerson] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function run(fn: () => Promise<{ error?: string }>, done?: string) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
      return false;
    }
    if (done) toast.success(done);
    onDone();
    return true;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Group">
      <div className="space-y-5 pb-6 pt-2">
        <div>
          <Label htmlFor="rename">Name</Label>
          <div className="flex gap-2">
            <Input id="rename" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="button" variant="secondary" disabled={busy || !name.trim() || name.trim() === group.name} onClick={() => run(() => renameGroupAction(group.id, name), "Renamed")}>
              Save
            </Button>
          </div>
        </div>

        <div>
          <Label>People</Label>
          <div className="overflow-hidden rounded-[22px] bg-surface-2">
            {group.members
              .filter((m) => !m.removed)
              .map((m, i) => (
                <div key={m.id} className={cn("flex items-center gap-3 px-4 py-2.5", i > 0 && "border-t border-divider")}>
                  <PartyAvatar name={m.name} keyName={m.id} size={36} />
                  <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-bold text-text-primary">{m.name}</span>
                  {!m.isYou && (
                    <button
                      type="button"
                      aria-label={`Remove ${m.name}`}
                      disabled={busy}
                      onClick={() => run(() => removeMemberAction(group.id, m.id), `${m.name} removed`)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-text-secondary hover:bg-surface-3"
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              ))}
          </div>
          <div className="mt-2.5 flex gap-2">
            <Input
              aria-label="Add a person"
              placeholder="Add a person"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (person.trim() && (await run(() => addMemberAction(group.id, person), "Added"))) setPerson("");
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              aria-label="Add this person"
              disabled={busy || !person.trim()}
              onClick={async () => {
                if (await run(() => addMemberAction(group.id, person), "Added")) setPerson("");
              }}
            >
              <UserPlus size={18} />
            </Button>
          </div>
          <p className="mt-2 text-xs text-text-secondary">Someone can leave once nothing is owed either way.</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              if (await run(() => setGroupArchivedAction(group.id, !group.archived), group.archived ? "Group restored" : "Group archived")) onOpenChange(false);
            }}
          >
            {group.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
            {group.archived ? "Restore" : "Archive"}
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => setConfirmDelete(true)}>
            <Trash2 size={18} />
            Delete
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this group?"
        description="Only a group with no expenses can be deleted. Archive one that has history."
        confirmLabel="Delete"
        destructive
        isConfirming={busy}
        onConfirm={async () => {
          setBusy(true);
          const res = await deleteGroupAction(group.id);
          setBusy(false);
          setConfirmDelete(false);
          if (res.error) return toast.error(res.error);
          toast.success("Group deleted");
          router.push("/groups");
        }}
      />
    </Sheet>
  );
}
