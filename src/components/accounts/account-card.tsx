import { ChevronUp, ChevronDown } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { getAccounts } from "@/lib/data/accounts";

type AccountRecord = Awaited<ReturnType<typeof getAccounts>>[number];

export function AccountCard({
  account,
  onOpen,
  reorder,
}: {
  account: AccountRecord;
  onOpen: () => void;
  /** Swaps the card's balance for up/down move buttons and drops the tap-to-open
   * behavior — present only while the accounts list is in reorder mode. A missing
   * handler (already first/last) disables that direction's button instead of hiding
   * it, so the control stays in the same place. */
  reorder?: { onMoveUp?: () => void; onMoveDown?: () => void };
}) {
  const typeLabel = ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ?? account.type;
  const isCreditCard = account.type === "CREDIT_CARD";
  const showLimit = isCreditCard && account.creditLimit != null;

  const content = (
    <>
      <IconChip icon={account.icon} color={account.color} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{account.name}</p>
        <p className="truncate text-xs text-text-muted">
          {showLimit ? `${typeLabel} · Limit ${formatMoney(account.creditLimit!, account.currency)}` : typeLabel}
          {account.isArchived ? " · Archived" : ""}
        </p>
      </div>
      {reorder ? (
        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            aria-label={`Move ${account.name} up`}
            disabled={!reorder.onMoveUp}
            onClick={reorder.onMoveUp}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary disabled:opacity-30"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            aria-label={`Move ${account.name} down`}
            disabled={!reorder.onMoveDown}
            onClick={reorder.onMoveDown}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary disabled:opacity-30"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      ) : (
        <Amount value={account.balance} currency={account.currency} size="md" />
      )}
    </>
  );

  if (reorder) {
    return (
      <div className={cn("flex w-full items-center gap-3 rounded-3xl bg-surface p-4", account.isArchived && "opacity-60")}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 rounded-3xl bg-surface p-4 text-left shadow-sm transition-colors hover:bg-surface-2",
        account.isArchived && "opacity-60",
      )}
    >
      {content}
    </button>
  );
}
