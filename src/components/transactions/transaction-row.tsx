"use client";

import { format } from "date-fns";
import { ArrowLeftRight, Clock } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { useTransactionSheet } from "@/stores/ui-store";
import { formatMoney } from "@/lib/money";
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
      className="flex w-full items-center gap-3 rounded-full px-2.5 py-2.5 text-left transition-colors hover:bg-surface-2"
    >
      {isTransfer ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-savings-subtle text-savings">
          <ArrowLeftRight size={17} strokeWidth={2} />
        </span>
      ) : (
        <IconChip icon={transaction.category?.icon ?? "circle"} color={transaction.category?.color ?? "slate"} />
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-text-primary">{transaction.title}</span>
          {transaction.status === "UPCOMING" && <Clock size={12} className="shrink-0 text-warning" />}
        </span>
        <span className="block truncate text-xs text-text-muted">
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
          className={transaction.status === "UPCOMING" ? "opacity-60" : ""}
        />
        <span className="mt-0.5 text-[0.6875rem] text-text-muted">
          {format(transaction.date, "MMM d")}
          {runningBalance !== undefined && ` · Bal ${formatMoney(runningBalance, transaction.currency)}`}
        </span>
      </span>
    </button>
  );
}
