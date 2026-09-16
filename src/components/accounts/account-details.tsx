"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { setAccountArchivedAction, deleteAccountAction } from "@/actions/accounts";
import { ACCOUNT_TYPES, BANK_SUBTYPES } from "@/lib/constants";
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
  const typeLabel = ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ?? account.type;
  const isCreditCard = account.type === "CREDIT_CARD";
  const hasLimit = isCreditCard && account.creditLimit != null;
  // Not clamped to 0 — a payment larger than the balance owed pushes this negative,
  // meaning the card issuer owes the user money (a credit balance). Clamping it to 0
  // here used to silently hide that instead of showing it as e.g. -₹100.00.
  const used = -account.balance;
  const usedPct = hasLimit && account.creditLimit! > 0 ? Math.min(100, Math.max(0, (used / account.creditLimit!) * 100)) : 0;
  const available = hasLimit ? account.creditLimit! - used : 0;

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
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(result.archived ? "Account archived (it has transactions)" : "Account deleted");
    onChanged();
  }

  const bankSubtypeLabel = account.type === "BANK" && account.bankSubtype
    ? BANK_SUBTYPES.find((t) => t.value === account.bankSubtype)?.label
    : undefined;

  const rows = [
    { label: "Type", value: typeLabel },
    ...(bankSubtypeLabel ? [{ label: "Account type", value: bankSubtypeLabel }] : []),
    { label: "Currency", value: account.currency },
    ...(hasLimit
      ? [
          { label: "Balance owed", value: formatMoney(used, account.currency) },
          { label: "Available credit", value: formatMoney(available, account.currency) },
        ]
      : []),
    ...(account.type === "SAVINGS"
      ? [{ label: "Usable for expenses", value: account.allowExpense ? "Yes" : "No" }]
      : []),
    ...(account.isArchived ? [{ label: "Status", value: "Archived" }] : []),
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <IconChip icon={account.icon} color={account.color} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-text-primary">{account.name}</p>
          {hasLimit && <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-muted">Credit limit</p>}
          <Amount value={hasLimit ? account.creditLimit! : account.balance} currency={account.currency} size="md" />
        </div>
      </div>

      {hasLimit && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{formatMoney(used, account.currency)} used</span>
            <span>{Math.round(usedPct)}%</span>
          </div>
          <Progress value={usedPct} tone={usedPct >= 90 ? "expense" : "accent"} label={`${Math.round(usedPct)}% of credit limit used`} />
        </div>
      )}

      <dl className="divide-y divide-divider rounded-2xl bg-surface-2/60 px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-3">
            <dt className="text-sm text-text-secondary">{row.label}</dt>
            <dd className="text-sm font-medium text-text-primary">{row.value}</dd>
          </div>
        ))}
      </dl>

      <Button onClick={onEdit} className="w-full" disabled={busy}>
        <Pencil size={16} strokeWidth={2.25} />
        Edit account
      </Button>

      {confirmDelete ? (
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete} loading={busy} loadingText="Deleting…">
            Yes, delete
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={handleArchiveToggle} loading={busy}>
            {account.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            {account.isArchived ? "Unarchive" : "Archive"}
          </Button>
          <Button type="button" variant="destructive" className="flex-1" onClick={() => setConfirmDelete(true)} disabled={busy}>
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
