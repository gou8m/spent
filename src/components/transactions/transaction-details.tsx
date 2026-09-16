"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeftRight, Pencil } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import { deleteTransactionAction } from "@/actions/transactions";
import { formatMoney } from "@/lib/money";
import type { getTransactionById } from "@/lib/data/transactions";

export function TransactionDetails({
  transaction,
  onEdit,
  onDeleted,
}: {
  transaction: NonNullable<Awaited<ReturnType<typeof getTransactionById>>>;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteTransactionAction(transaction.id);
    setIsDeleting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Transaction deleted");
    onDeleted();
  }
  const isTransfer = transaction.type === "TRANSFER";

  const rows: { label: string; value: React.ReactNode }[] = isTransfer
    ? [
        { label: "From account", value: transaction.account.name },
        { label: "To account", value: transaction.transferToAccount?.name ?? "—" },
        ...(transaction.transferToAmount && transaction.transferToAccount
          ? [
              {
                label: "Converted to",
                value: <Amount value={transaction.transferToAmount} currency={transaction.transferToAccount.currency} size="sm" />,
              },
            ]
          : []),
      ]
    : [
        { label: "Category", value: transaction.category?.name ?? "Uncategorized" },
        { label: "Account", value: transaction.account.name },
      ];
  if (transaction.runningBalance !== undefined) {
    rows.push({ label: "Balance", value: formatMoney(transaction.runningBalance, transaction.currency) });
  }
  rows.push({ label: "Date", value: format(transaction.date, "MMM d, yyyy") });
  if (transaction.note) rows.push({ label: "Note", value: transaction.note });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        {isTransfer ? (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-savings-subtle text-savings">
            <ArrowLeftRight size={22} strokeWidth={2} />
          </span>
        ) : (
          <IconChip icon={transaction.category?.icon ?? "circle"} color={transaction.category?.color ?? "slate"} size="lg" />
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-text-primary">{transaction.title}</p>
          <Amount value={transaction.amount} currency={transaction.currency} direction={transaction.type} signed size="md" />
        </div>
      </div>

      <dl className="divide-y divide-divider rounded-2xl bg-surface-2/60 px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-3">
            <dt className="text-sm text-text-secondary">{row.label}</dt>
            <dd className="truncate text-sm font-medium text-text-primary">{row.value}</dd>
          </div>
        ))}
      </dl>

      {confirmDelete ? (
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete} loading={isDeleting} loadingText="Deleting…">
            Yes, delete
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
          <Button onClick={onEdit} className="flex-1">
            <Pencil size={16} strokeWidth={2.25} />
            Edit transaction
          </Button>
        </div>
      )}
    </div>
  );
}
