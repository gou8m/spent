"use client";

import { ArrowLeftRight, Clock, Handshake } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { useTransactionSheet } from "@/stores/ui-store";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/data/transactions";

export function TransactionRow({
  transaction,
  runningBalance,
}: {
  transaction: TransactionWithRelations;
  runningBalance?: number;
}) {
  const open = useTransactionSheet((s) => s.open);
  const isTransfer = transaction.type === "TRANSFER";

  return (
    <button
      type="button"
      onClick={() => open({ transactionId: transaction.id })}
      className="flex w-full items-center gap-3.5 rounded-lg bg-surface-2 px-4 py-3 text-left transition-colors hover:bg-surface-3"
    >
      {isTransfer ? (
        <span className="flex h-13.5 w-13.5 shrink-0 items-center justify-center rounded-md bg-surface text-savings">
          <ArrowLeftRight size={24} strokeWidth={2} />
        </span>
      ) : (
        <IconChip icon={transaction.category?.icon ?? "circle"} color={transaction.category?.color ?? "slate"} size="lg" flat />
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-base font-semibold text-text-primary">{transaction.title}</span>
          {transaction.status === "UPCOMING" && <Clock size={12} className="shrink-0 text-warning" />}
          {(transaction.loan || transaction.repaysLoan) && <Handshake size={12} className="shrink-0 text-accent-text" />}
        </span>
        <span className="mt-0.5 block truncate text-[0.8125rem] text-text-secondary">
          {isTransfer
            ? `${transaction.account.name} → ${transaction.transferToAccount?.name ?? ""}`
            : `${transaction.category?.name ?? "Uncategorized"} · ${transaction.account.name}`}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end">
        <Amount
          value={transaction.amount}
          currency={transaction.currency}
          direction={transaction.type}
          signed
          size="sm"
          className={cn("font-bold", transaction.status === "UPCOMING" && "opacity-60")}
        />
        {runningBalance !== undefined && (
          <span className="mt-0.5 text-[0.6875rem] text-text-muted">{formatMoney(runningBalance, transaction.currency)}</span>
        )}
      </span>
    </button>
  );
}
