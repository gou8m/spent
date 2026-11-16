"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeftRight, Pencil, Copy, X } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toMajorUnits } from "@/lib/money";
import { deleteTransactionAction, createTransactionAction } from "@/actions/transactions";
import { formatMoney } from "@/lib/money";
import type { getTransactionById } from "@/lib/data/transactions";

export function TransactionDetails({
  transaction,
  onEdit,
  onDuplicate,
  onDeleted,
  variant = "sheet",
  onClose,
}: {
  transaction: NonNullable<Awaited<ReturnType<typeof getTransactionById>>>;
  onEdit: () => void;
  onDuplicate: () => void;
  onDeleted: () => void;
  /** "panel" is the desktop side card (reference 59); "sheet" the mobile bottom sheet. */
  variant?: "sheet" | "panel";
  onClose?: () => void;
}) {
  const router = useRouter();
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
    // Loans, loan repayments and goal contributions carry linked rows that a plain
    // re-create would not restore, so only simple transactions get an Undo.
    const restorable = !transaction.loan && !transaction.repaysLoan && !transaction.goalId;
    toast(`${transaction.title} deleted`, {
      action: restorable
        ? {
            label: "Undo",
            onClick: async () => {
              const restored = await createTransactionAction({
                type: transaction.type as "EXPENSE" | "INCOME" | "TRANSFER",
                amount: toMajorUnits(transaction.amount, transaction.currency),
                currency: transaction.currency,
                accountId: transaction.accountId,
                transferToAccountId: transaction.transferToAccountId ?? undefined,
                transferToAmount:
                  transaction.transferToAmount && transaction.transferToAccount
                    ? toMajorUnits(transaction.transferToAmount, transaction.transferToAccount.currency)
                    : undefined,
                categoryId: transaction.categoryId ?? undefined,
                title: transaction.title,
                note: transaction.note ?? undefined,
                date: transaction.date,
                status: transaction.status as "COMPLETED" | "UPCOMING",
                tagIds: transaction.tags.map((t) => t.tagId),
              });
              if (restored.error) toast.error(restored.error);
              else {
                toast.success("Transaction restored");
                router.refresh();
              }
            },
          }
        : undefined,
    });
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
    rows.push({ label: "Balance after", value: formatMoney(transaction.runningBalance, transaction.currency) });
  }
  rows.push({ label: "Date", value: format(transaction.date, "MMM d, yyyy") });
  if (transaction.note) rows.push({ label: "Note", value: transaction.note });
  if (transaction.loan) {
    rows.push({
      label: transaction.loan.direction === "LENT" ? "Returns by" : "Repay by",
      value: format(transaction.loan.dueDate, "MMM d, yyyy"),
    });
    const repaidAmount = transaction.loan.repayments.reduce((sum, r) => sum + r.amount, 0);
    if (repaidAmount > 0) {
      rows.push({
        label: "Repaid",
        value:
          repaidAmount >= transaction.amount
            ? "Fully repaid"
            : `${formatMoney(repaidAmount, transaction.currency)} of ${formatMoney(transaction.amount, transaction.currency)}`,
      });
    }
  }
  if (transaction.repaysLoan) {
    rows.push({
      label: transaction.repaysLoan.direction === "LENT" ? "Repayment for loan to" : "Repayment for loan from",
      value: transaction.repaysLoan.transaction.title,
    });
  }

  if (variant === "panel") {
    return (
      <section className="rounded-[28px] bg-surface p-5.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[1.0625rem] font-extrabold text-text-primary">Details</h2>
          <button
            type="button"
            aria-label="Close details"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="mt-4 text-center">
          {isTransfer ? (
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-sky text-sky-text">
              <ArrowLeftRight size={28} strokeWidth={2} />
            </span>
          ) : (
            <IconChip icon={transaction.category?.icon ?? "circle"} color={transaction.category?.color ?? "slate"} size="lg" className="mx-auto h-16 w-16 rounded-[20px]" />
          )}
          <p className="mt-3 leading-none">
            <Amount value={transaction.amount} currency={transaction.currency} direction={transaction.type} signed size="lg" className="sm:text-[2.5rem] text-[2.5rem] tracking-[-1.5px]" />
          </p>
          <p className="mt-1 truncate text-[0.9375rem] font-semibold text-text-primary">{transaction.title}</p>
        </div>

        <dl className="mt-3">
          {rows.map((row) => (
            <div key={row.label} className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
              <dt className="text-text-secondary">{row.label}</dt>
              <dd className="truncate font-bold text-text-primary">{row.value}</dd>
            </div>
          ))}
        </dl>

        {confirmDelete ? (
          <div className="mt-5 flex items-center gap-2.5">
            <Button type="button" variant="outline" className="h-12 flex-1 rounded-[18px] font-bold" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="h-12 flex-1 rounded-[18px] font-bold" onClick={handleDelete} loading={isDeleting} loadingText="Deleting…">
              Yes, delete
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-5 flex gap-2.5">
              <Button type="button" variant="secondary" onClick={onEdit} className="h-12 flex-1 rounded-[18px] px-2 font-bold">
                <Pencil size={16} strokeWidth={2.25} />
                Edit
              </Button>
              <Button type="button" variant="secondary" onClick={onDuplicate} className="h-12 flex-1 rounded-[18px] px-2 font-bold">
                <Copy size={16} strokeWidth={2.25} />
                Duplicate
              </Button>
            </div>
            <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)} className="mt-2.5 h-12 w-full rounded-[18px] font-bold">
              Delete
            </Button>
          </>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-4 pb-2">
      <div className="flex items-center gap-3.5">
        {isTransfer ? (
          <span className="flex h-13.5 w-13.5 shrink-0 items-center justify-center rounded-[16px] bg-sky text-sky-text">
            <ArrowLeftRight size={24} strokeWidth={2} />
          </span>
        ) : (
          <IconChip icon={transaction.category?.icon ?? "circle"} color={transaction.category?.color ?? "slate"} size="lg" className="h-13.5 w-13.5 rounded-[16px]" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-extrabold tracking-tight text-text-primary">{transaction.title}</h2>
          <p className="mt-0.5 text-[0.8125rem] text-text-secondary">{format(transaction.date, "MMM d")}</p>
        </div>
        <Dialog.Close
          aria-label="Close"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
        >
          <X size={18} strokeWidth={2} />
        </Dialog.Close>
      </div>

      <p className="mt-4.5 leading-none">
        <Amount value={transaction.amount} currency={transaction.currency} direction={transaction.type} signed size="lg" className="sm:text-[2.75rem] tracking-[-1.5px]" />
      </p>

      <dl className="overflow-hidden rounded-[22px] bg-surface-2">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between gap-3 px-4 py-3.25 text-sm ${i < rows.length - 1 ? "border-b border-divider" : ""}`}
          >
            <dt className="font-semibold text-text-secondary">{row.label}</dt>
            <dd className="truncate font-bold text-text-primary">{row.value}</dd>
          </div>
        ))}
      </dl>

      {confirmDelete ? (
        <div className="flex items-center gap-2.5">
          <Button type="button" variant="outline" className="flex-1 rounded-[18px] font-bold" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" className="flex-1 rounded-[18px] font-bold" onClick={handleDelete} loading={isDeleting} loadingText="Deleting…">
            Yes, delete
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <Button onClick={onEdit} className="flex-1 rounded-[18px] px-2 font-bold shadow-none">
            <Pencil size={16} strokeWidth={2.25} />
            Edit
          </Button>
          <Button type="button" variant="secondary" onClick={onDuplicate} className="flex-1 rounded-[18px] px-2 font-bold">
            <Copy size={16} strokeWidth={2.25} />
            Duplicate
          </Button>
          <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)} className="flex-1 rounded-[18px] px-2 font-bold">
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
