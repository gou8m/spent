"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm, type EditableAccount } from "@/components/accounts/account-form";
import type { getAccounts } from "@/lib/data/accounts";

export function AccountsView({ accounts }: { accounts: Awaited<ReturnType<typeof getAccounts>> }) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EditableAccount | undefined>(undefined);

  const active = accounts.filter((a) => !a.isArchived);
  const archived = accounts.filter((a) => a.isArchived);

  function openAdd() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function openEdit(account: (typeof accounts)[number]) {
    setEditing({
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      startingBalance: account.startingBalance,
      icon: account.icon,
      color: account.color,
    });
    setSheetOpen(true);
  }

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
              <AccountCard key={account.id} account={account} onEdit={() => openEdit(account)} />
            ))}
          </div>

          {archived.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-text-secondary">Archived</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {archived.map((account) => (
                  <AccountCard key={account.id} account={account} onEdit={() => openEdit(account)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? "Edit account" : "Add account"}>
        <AccountForm
          editing={editing}
          onSaved={() => {
            setSheetOpen(false);
            router.refresh();
          }}
        />
      </Sheet>
    </div>
  );
}
