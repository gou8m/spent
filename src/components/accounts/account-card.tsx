import { ChevronUp, ChevronDown } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { Progress } from "@/components/ui/progress";
import { ACCOUNT_TYPES, BANK_SUBTYPES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { getAccounts } from "@/lib/data/accounts";

type AccountRecord = Awaited<ReturnType<typeof getAccounts>>[number];

export function AccountCard({
  account,
  onOpen,
  reorder,
  heldForGoals,
}: {
  account: AccountRecord;
  onOpen: () => void;
  /** Swaps the card's balance for up/down move buttons and drops the tap-to-open
   * behavior — present only while the accounts list is in reorder mode. A missing
   * handler (already first/last) disables that direction's button instead of hiding
   * it, so the control stays in the same place. */
  reorder?: { onMoveUp?: () => void; onMoveDown?: () => void };
  /** Minor units of this account's balance that goals have set aside inside it. */
  heldForGoals?: number;
}) {
  const typeLabel = ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ?? account.type;
  const isCreditCard = account.type === "CREDIT_CARD";
  const hasLimit = isCreditCard && account.creditLimit != null;
  const bankSubtypeLabel =
    account.type === "BANK" && account.bankSubtype ? BANK_SUBTYPES.find((t) => t.value === account.bankSubtype)?.label : undefined;

  const subtitle = hasLimit
    ? `${typeLabel} · Limit ${formatMoney(account.creditLimit!, account.currency)}`
    : bankSubtypeLabel
      ? `${bankSubtypeLabel} account`
      : typeLabel;

  // Not clamped to 0 — a payment larger than the balance owed means the card
  // issuer owes the user money, same convention as account-details.tsx.
  const used = isCreditCard ? -account.balance : 0;
  const usedPct = hasLimit && account.creditLimit! > 0 ? Math.min(100, Math.max(0, (used / account.creditLimit!) * 100)) : 0;

  const row = (
    <div className="flex items-center gap-3.5">
      <IconChip icon={account.icon} color={account.color} size="lg" flat />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-text-primary">{account.name}</p>
        <p className="truncate text-xs text-text-secondary">
          {subtitle}
          {account.isArchived ? " · Archived" : ""}
        </p>
        {!!heldForGoals && heldForGoals > 0 && (
          <p className="truncate text-xs font-semibold text-accent-text">{formatMoney(heldForGoals, account.currency)} set aside for goals</p>
        )}
      </div>
      {reorder ? (
        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            aria-label={`Move ${account.name} up`}
            disabled={!reorder.onMoveUp}
            onClick={reorder.onMoveUp}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary disabled:opacity-30"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            aria-label={`Move ${account.name} down`}
            disabled={!reorder.onMoveDown}
            onClick={reorder.onMoveDown}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary disabled:opacity-30"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      ) : (
        <Amount value={account.balance} currency={account.currency} size="md" className="shrink-0" />
      )}
    </div>
  );

  if (reorder) {
    return <div className={cn("w-full rounded-lg bg-surface-2 p-4", account.isArchived && "opacity-60")}>{row}</div>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn("w-full rounded-lg bg-surface-2 p-4 text-left transition-colors hover:bg-surface-3", account.isArchived && "opacity-60")}
    >
      {row}
      {hasLimit && (
        <div className="mt-3">
          <Progress value={usedPct} tone={usedPct >= 90 ? "expense" : "accent"} label={`${Math.round(usedPct)}% of credit limit used`} />
          <p className="mt-1.5 text-xs font-semibold text-text-secondary">
            {Math.round(usedPct)}% of {formatMoney(account.creditLimit!, account.currency)} limit used
          </p>
        </div>
      )}
    </button>
  );
}
