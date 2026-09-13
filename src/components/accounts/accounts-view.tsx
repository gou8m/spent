"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountDetails } from "@/components/accounts/account-details";
import { AccountForm, type EditableAccount } from "@/components/accounts/account-form";
import type { getAccounts } from "@/lib/data/accounts";

type AccountRecord = Awaited<ReturnType<typeof getAccounts>>[number];
type Mode = "add" | "view" | "edit";

export function AccountsView({ accounts }: { accounts: AccountRecord[] }) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [selected, setSelected] = useState<AccountRecord | undefined>(undefined);

  const active = accounts.filter((a) => !a.isArchived);
  const archived = accounts.filter((a) => a.isArchived);

  function openAdd() {
    setSelected(undefined);
    setMode("add");
    setSheetOpen(true);
  }

  function openView(account: AccountRecord) {
    setSelected(account);
    setMode("view");
    setSheetOpen(true);
  }

  function close() {
    setSheetOpen(false);
    router.refresh();
  }

  const editable: EditableAccount | undefined = selected
    ? {
        id: selected.id,
        name: selected.name,
        type: selected.type,
        currency: selected.currency,
        startingBalance: selected.startingBalance,
        icon: selected.icon,
        color: selected.color,
      }
    : undefined;

  const title = mode === "add" ? "Add account" : mode === "edit" ? "Edit account" : "Account details";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Accounts</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus size={16} strokeWidth={2.5} />
          Add account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState icon={Wallet} title="No accounts yet" description="Add a bank, cash, or card account to start tracking balances." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {active.map((account) => (
              <AccountCard key={account.id} account={account} onOpen={() => openView(account)} />
            ))}
          </div>

          {archived.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-text-secondary">Archived</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {archived.map((account) => (
                  <AccountCard key={account.id} account={account} onOpen={() => openView(account)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={title}>
        {mode === "view" && selected ? (
          <AccountDetails account={selected} onEdit={() => setMode("edit")} onChanged={close} />
        ) : (
          <AccountForm editing={editable} onSaved={close} onDiscard={mode === "edit" ? () => setMode("view") : undefined} />
        )}
      </Sheet>
    </div>
  );
}
