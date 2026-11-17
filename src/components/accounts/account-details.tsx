"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeftRight, Plus as PlusIcon, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { setAccountArchivedAction, deleteAccountAction } from "@/actions/accounts";
import { useAccountActivity } from "@/hooks/use-account-activity";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionSheet } from "@/stores/ui-store";
import { formatMoney } from "@/lib/money";
import type { getAccounts } from "@/lib/data/accounts";

type AccountRecord = Awaited<ReturnType<typeof getAccounts>>[number];

export function AccountDetails({
  account,
  onEdit,
  onChanged,
}: {
  account: AccountRecord;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const activity = useAccountActivity(account.id);
  const openTransactionSheet = useTransactionSheet((s) => s.open);

  const isCreditCard = account.type === "CREDIT_CARD";
  const hasLimit = isCreditCard && account.creditLimit != null;
  // Not clamped to 0 — a payment larger than the balance owed pushes this negative,
  // meaning the card issuer owes the user money (a credit balance).
  const used = -account.balance;
  const usedPct = hasLimit && account.creditLimit! > 0 ? Math.min(100, Math.max(0, (used / account.creditLimit!) * 100)) : 0;
  const available = hasLimit ? account.creditLimit! - used : 0;

  const sparklinePath = (() => {
    if (!activity || activity.sparkline.length < 2) return null;
    const width = 300;
    const height = 64;
    const min = Math.min(...activity.sparkline);
    const max = Math.max(...activity.sparkline);
    const range = max - min || 1;
    return activity.sparkline
      .map((v, i) => {
        const x = (i / (activity.sparkline.length - 1)) * width;
        const y = height - 6 - ((v - min) / range) * (height - 12);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  })();

  async function handleArchiveToggle() {
    setBusy(true);
    const result = await setAccountArchivedAction(account.id, !account.isArchived);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(account.isArchived ? "Account unarchived" : "Account archived");
    onChanged();
  }

  async function handleDelete() {
    setBusy(true);
    const result = await deleteAccountAction(account.id);
    setBusy(false);
    setConfirmDelete(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(result.archived ? "Account archived (it has transactions)" : "Account deleted");
    onChanged();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <IconChip icon={account.icon} color={account.color} size="lg" />
        <p className="truncate text-lg font-semibold text-text-primary">{account.name}</p>
      </div>

      {isCreditCard ? (
        <div className="space-y-1.5">
          <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-muted">Credit limit</p>
          <Amount value={hasLimit ? account.creditLimit! : account.balance} currency={account.currency} size="md" />
          {hasLimit && (
            <>
              <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
                <span>{formatMoney(used, account.currency)} used</span>
                <span>{Math.round(usedPct)}%</span>
              </div>
              <Progress value={usedPct} tone={usedPct >= 90 ? "expense" : "accent"} label={`${Math.round(usedPct)}% of credit limit used`} />
              <p className="text-xs text-text-secondary">{formatMoney(available, account.currency)} available</p>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-2xl p-5.5 pb-4.5" style={{ background: "var(--hero-gradient)" }}>
          <p className="text-[0.9375rem] font-semibold text-hero-text-secondary">{account.name}</p>
          <p className="mt-1.5 text-[2.5rem] font-extrabold tracking-[-0.03em] text-hero-text">{formatMoney(account.balance, account.currency)}</p>
          {/* The chart and its caption have a fixed height, so the card does not grow when they arrive. */}
          {sparklinePath ? (
            <svg width="100%" height="64" viewBox="0 0 300 64" preserveAspectRatio="none" className="animate-fade-in mt-2" role="img" aria-label="Balance over the last 30 days">
              <path d={sparklinePath} fill="none" stroke="var(--color-hero-text)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <div className="mt-2 h-16 rounded-lg bg-white/25 motion-safe:animate-pulse" aria-hidden="true" style={activity ? { visibility: "hidden" } : undefined} />
          )}
          {activity ? (
            <div className="animate-fade-in mt-2 flex items-center justify-between text-xs font-semibold text-hero-text-secondary">
              <span>30 days ago</span>
              <span>
                {activity.monthChange >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(activity.monthChange), account.currency)} this month
              </span>
            </div>
          ) : (
            <div className="mt-2 h-4" aria-hidden="true" />
          )}
        </div>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => openTransactionSheet({ type: "TRANSFER" })}
          className="flex h-19 flex-1 flex-col items-center justify-center gap-1.5 rounded-lg bg-surface-2 text-[0.8125rem] font-bold text-text-primary transition-colors hover:bg-surface-3"
        >
          <ArrowLeftRight size={22} strokeWidth={2} className="text-accent-text" />
          Transfer
        </button>
        <button
          type="button"
          onClick={() => openTransactionSheet({ type: "INCOME" })}
          className="flex h-19 flex-1 flex-col items-center justify-center gap-1.5 rounded-lg bg-surface-2 text-[0.8125rem] font-bold text-text-primary transition-colors hover:bg-surface-3"
        >
          <PlusIcon size={22} strokeWidth={2} className="text-accent-text" />
          Add income
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex h-19 flex-1 flex-col items-center justify-center gap-1.5 rounded-lg bg-surface-2 text-[0.8125rem] font-bold text-text-primary transition-colors hover:bg-surface-3"
        >
          <Pencil size={22} strokeWidth={2} className="text-accent-text" />
          Edit
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-text-primary">Activity</h2>
          <Link href={`/transactions?account=${account.id}`} className="text-[0.8125rem] font-bold text-accent-text">
            See all
          </Link>
        </div>
        <div className="mt-2.5 flex flex-col gap-2">
          {activity === null ? (
            // Same height as real rows, so the list does not jump when it arrives.
            <div aria-busy="true" aria-label="Loading activity" className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-19 w-full rounded-[22px]" />
              ))}
            </div>
          ) : activity.transactions.length === 0 ? (
            <p className="animate-fade-in py-4 text-center text-sm text-text-secondary">No activity yet.</p>
          ) : (
            <div className="animate-fade-in flex flex-col gap-2">
              {activity.transactions.map((t) => (
                <TransactionRow key={t.id} transaction={t} runningBalance={activity.runningBalances[`${t.id}:${account.id}`]} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={handleArchiveToggle} loading={busy}>
          {account.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          {account.isArchived ? "Unarchive" : "Archive"}
        </Button>
        <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)} disabled={busy}>
          <Trash2 size={16} />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this account?"
        description="This can't be undone. Accounts with transactions are archived instead of deleted."
        confirmLabel="Delete"
        destructive
        isConfirming={busy}
        onConfirm={handleDelete}
      />
    </div>
  );
}
