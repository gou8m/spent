import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { getAccounts } from "@/lib/data/accounts";

type AccountRecord = Awaited<ReturnType<typeof getAccounts>>[number];

export function AccountCard({ account, onOpen }: { account: AccountRecord; onOpen: () => void }) {
  const typeLabel = ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ?? account.type;
  const isCreditCard = account.type === "CREDIT_CARD";
  const showLimit = isCreditCard && account.creditLimit != null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 rounded-3xl bg-surface p-4 text-left shadow-sm transition-colors hover:bg-surface-2",
        account.isArchived && "opacity-60",
      )}
    >
      <IconChip icon={account.icon} color={account.color} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{account.name}</p>
        <p className="text-xs text-text-muted">
          {showLimit ? "Limit" : typeLabel}
          {account.isArchived ? " · Archived" : ""}
        </p>
      </div>
      <Amount value={showLimit ? account.creditLimit! : account.balance} currency={account.currency} size="md" />
    </button>
  );
}
