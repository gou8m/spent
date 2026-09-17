"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Wallet, ArrowUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountDetails } from "@/components/accounts/account-details";
import { AccountForm, type EditableAccount } from "@/components/accounts/account-form";
import { reorderAccountsAction } from "@/actions/accounts";
import type { getAccounts } from "@/lib/data/accounts";

type AccountRecord = Awaited<ReturnType<typeof getAccounts>>[number];
type Mode = "add" | "view" | "edit";

export function AccountsView({ accounts, defaultCurrency }: { accounts: AccountRecord[]; defaultCurrency: string }) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [selected, setSelected] = useState<AccountRecord | undefined>(undefined);
  const [reordering, setReordering] = useState(false);

  // Reordering needs its own copy to move optimistically ahead of the server —
  // reset to match `accounts` each time reorder mode is (re)entered, same "adjust
  // state during render" pattern used for the transaction sheet's mode reset.
  const [orderedActive, setOrderedActive] = useState<AccountRecord[]>([]);
  const [wasReordering, setWasReordering] = useState(false);
  if (reordering !== wasReordering) {
    setWasReordering(reordering);
    if (reordering) setOrderedActive(accounts.filter((a) => !a.isArchived));
  }

  const active = reordering ? orderedActive : accounts.filter((a) => !a.isArchived);
  const archived = accounts.filter((a) => a.isArchived);

  async function move(index: number, direction: -1 | 1) {
    const next = [...orderedActive];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrderedActive(next);

    const result = await reorderAccountsAction(next.map((a) => a.id));
    if (result.error) toast.error(result.error);
  }

  function doneReordering() {
    setReordering(false);
    router.refresh();
  }

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
        bankSubtype: selected.bankSubtype,
        currency: selected.currency,
        startingBalance: selected.startingBalance,
        creditLimit: selected.creditLimit,
        allowExpense: selected.allowExpense,
        isEmergencyFund: selected.isEmergencyFund,
        icon: selected.icon,
        color: selected.color,
      }
    : undefined;

  const title = mode === "add" ? "Add account" : mode === "edit" ? "Edit account" : "Account details";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Accounts</h1>
        {reordering ? (
          <Button size="sm" onClick={doneReordering}>
            <Check size={16} strokeWidth={2.5} />
            Done
          </Button>
        ) : (
          <div className="flex items-center gap-1.5">
            {active.length > 1 && (
              <button
                type="button"
                aria-label="Reorder accounts"
                onClick={() => setReordering(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
              >
                <ArrowUpDown size={16} strokeWidth={2.25} />
              </button>
            )}
            <Button size="sm" onClick={openAdd}>
              <Plus size={16} strokeWidth={2.5} />
              Add account
            </Button>
          </div>
        )}
      </div>

      {accounts.length === 0 ? (
        <EmptyState icon={Wallet} title="No accounts yet" description="Add a bank, cash, or card account to start tracking balances." />
      ) : (
        <div className="space-y-6">
          <div className={reordering ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 gap-3 sm:grid-cols-2"}>
            {active.map((account, i) => (
              <AccountCard
                key={account.id}
                account={account}
                onOpen={() => openView(account)}
                reorder={
                  reordering
                    ? {
                        onMoveUp: i > 0 ? () => move(i, -1) : undefined,
                        onMoveDown: i < active.length - 1 ? () => move(i, 1) : undefined,
                      }
                    : undefined
                }
              />
            ))}
          </div>

          {!reordering && archived.length > 0 && (
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
          <AccountForm
            editing={editable}
            defaultCurrency={defaultCurrency}
            onSaved={close}
            onDiscard={mode === "edit" ? () => setMode("view") : undefined}
          />
        )}
      </Sheet>
    </div>
  );
}
