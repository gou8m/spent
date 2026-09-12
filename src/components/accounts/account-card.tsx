"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { setAccountArchivedAction, deleteAccountAction } from "@/actions/accounts";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { getAccounts } from "@/lib/data/accounts";

type AccountRecord = Awaited<ReturnType<typeof getAccounts>>[number];

export function AccountCard({ account, onEdit }: { account: AccountRecord; onEdit: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const typeLabel = ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ?? account.type;

  async function handleArchiveToggle() {
    setBusy(true);
    const result = await setAccountArchivedAction(account.id, !account.isArchived);
    setBusy(false);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${account.name}"? This can't be undone.`)) return;
    setBusy(true);
    const result = await deleteAccountAction(account.id);
    setBusy(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.archived ? "Account archived (it has transactions)" : "Account deleted");
      router.refresh();
    }
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-lg border border-border bg-surface p-4", account.isArchived && "opacity-60")}>
      <IconChip icon={account.icon} color={account.color} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{account.name}</p>
        <p className="text-xs text-text-muted">{typeLabel}{account.isArchived ? " · Archived" : ""}</p>
      </div>
      <Amount value={account.balance} currency={account.currency} size="md" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={busy}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text-primary"
          >
            <MoreHorizontal size={17} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil size={14} /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchiveToggle}>
            {account.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            {account.isArchived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuItem destructive onClick={handleDelete}>
            <Trash2 size={14} /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
