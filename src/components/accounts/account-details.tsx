"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import { setAccountArchivedAction, deleteAccountAction } from "@/actions/accounts";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { formatMoney, toMinorUnits } from "@/lib/money";
import type { DenominationCounts } from "@/lib/denominations";
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

  const rows = [
    { label: "Type", value: typeLabel },
    { label: "Currency", value: account.currency },
    { label: "Starting balance", value: <Amount value={account.startingBalance} currency={account.currency} size="sm" /> },
    ...(account.isArchived ? [{ label: "Status", value: "Archived" }] : []),
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <IconChip icon={account.icon} color={account.color} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-text-primary">{account.name}</p>
          <Amount value={account.balance} currency={account.currency} size="md" />
        </div>
      </div>

      <dl className="divide-y divide-divider rounded-2xl bg-surface-2/60 px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-3">
            <dt className="text-sm text-text-secondary">{row.label}</dt>
            <dd className="text-sm font-medium text-text-primary">{row.value}</dd>
          </div>
        ))}
      </dl>

      {account.type === "CASH" &&
        account.cashDenominations &&
        Object.keys(account.cashDenominations as DenominationCounts).length > 0 && (
          <div>
            <p className="mb-2 px-1 text-sm font-semibold text-text-primary">Denomination breakdown</p>
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-2/60 p-3 sm:grid-cols-4">
              {Object.entries(account.cashDenominations as DenominationCounts)
                .sort((a, b) => Number(b[0]) - Number(a[0]))
                .map(([value, count]) => (
                  <div key={value} className="text-center">
                    <p className="text-xs text-text-muted">{formatMoney(toMinorUnits(Number(value), account.currency), account.currency)}</p>
                    <p className={`text-sm font-semibold ${count < 0 ? "text-error" : "text-text-primary"}`}>×{count}</p>
                  </div>
                ))}
            </div>
            {Object.values(account.cashDenominations as DenominationCounts).some((c) => c < 0) && (
              <p className="mt-2 text-xs text-error">
                A negative count means more of that note/coin was recorded spent than this account had on file.
              </p>
            )}
          </div>
        )}

      <Button onClick={onEdit} className="w-full" disabled={busy}>
        <Pencil size={16} strokeWidth={2.25} />
        Edit account
      </Button>

      {confirmDelete ? (
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete} disabled={busy}>
            {busy ? "Deleting…" : "Yes, delete"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={handleArchiveToggle} disabled={busy}>
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
