"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Wallet, ArrowUpDown, Check, Shield } from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountDetails } from "@/components/accounts/account-details";
import { AccountForm, type EditableAccount } from "@/components/accounts/account-form";
import { reorderAccountsAction } from "@/actions/accounts";
import { formatMoney } from "@/lib/money";
import type { getAccounts } from "@/lib/data/accounts";

type AccountRecord = Awaited<ReturnType<typeof getAccounts>>[number];
type Mode = "add" | "view" | "edit";

export interface NetWorthSummary {
  assets: number;
  owed: number;
  total: number;
  hasOtherCurrency: boolean;
  emergencyFund: { name: string; months: number } | null;
}

export function AccountsView({
  accounts,
  defaultCurrency,
  netWorth,
}: {
  accounts: AccountRecord[];
  defaultCurrency: string;
  netWorth: NetWorthSummary;
}) {
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
  const cashAndBank = active.filter((a) => a.type !== "CREDIT_CARD");
  const credit = active.filter((a) => a.type === "CREDIT_CARD");

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
      <BackHeader
        desktopRoot
        href="/dashboard"
        title="Accounts"
        action={
          reordering ? (
            <Button size="sm" onClick={doneReordering} className="shrink-0">
              <Check size={16} strokeWidth={2.5} />
              Done
            </Button>
          ) : (
            <div className="flex shrink-0 items-center gap-1.5">
              {active.length > 1 && (
                <button
                  type="button"
                  aria-label="Reorder accounts"
                  onClick={() => setReordering(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
                >
                  <ArrowUpDown size={18} strokeWidth={2.25} />
                </button>
              )}
              <button
                type="button"
                aria-label="Add account"
                onClick={openAdd}
                className="flex h-11 w-11 items-center justify-center rounded-sm bg-accent text-text-on-accent transition-colors hover:bg-accent-hover"
              >
                <Plus size={22} strokeWidth={2.5} />
              </button>
            </div>
          )
        }
      />

      {accounts.length === 0 ? (
        <EmptyState icon={Wallet} title="No accounts yet" description="Add a bank, cash, or card account to start tracking balances." />
      ) : (
        <div className="space-y-6">
          {!reordering && (
            <div className="rounded-2xl p-6" style={{ background: "var(--hero-gradient)" }}>
              <p className="text-[0.9375rem] font-semibold text-hero-text-secondary">Net worth</p>
              <p className="mt-2 text-[2.75rem] font-extrabold tracking-[-0.03em] text-hero-text">{formatMoney(netWorth.total, defaultCurrency)}</p>
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                <span className="rounded-full bg-white/55 px-3 py-1.5 text-[0.8125rem] font-bold text-hero-text-secondary dark:bg-white/[0.14]">
                  Assets {formatMoney(netWorth.assets, defaultCurrency)}
                </span>
                <span className="rounded-full bg-white/55 px-3 py-1.5 text-[0.8125rem] font-bold text-hero-text-secondary dark:bg-white/[0.14]">
                  Owed {formatMoney(netWorth.owed, defaultCurrency)}
                </span>
              </div>
              {netWorth.hasOtherCurrency && (
                <p className="mt-3 text-xs font-medium text-hero-text-secondary">Other-currency accounts aren&apos;t included above.</p>
              )}
            </div>
          )}

          {reordering ? (
            <div className="flex flex-col gap-2.5">
              {active.map((account, i) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onOpen={() => openView(account)}
                  reorder={{
                    onMoveUp: i > 0 ? () => move(i, -1) : undefined,
                    onMoveDown: i < active.length - 1 ? () => move(i, 1) : undefined,
                  }}
                />
              ))}
            </div>
          ) : (
            <>
              {cashAndBank.length > 0 && (
                <div>
                  <h2 className="mb-2.5 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Cash &amp; bank</h2>
                  <div className="flex flex-col gap-2.5">
                    {cashAndBank.map((account) => (
                      <AccountCard key={account.id} account={account} onOpen={() => openView(account)} />
                    ))}
                  </div>
                </div>
              )}

              {credit.length > 0 && (
                <div>
                  <h2 className="mb-2.5 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Credit</h2>
                  <div className="flex flex-col gap-2.5">
                    {credit.map((account) => (
                      <AccountCard key={account.id} account={account} onOpen={() => openView(account)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!reordering && netWorth.emergencyFund && (
            <div className="flex items-center gap-3 rounded-lg bg-accent-subtle px-4 py-3.5">
              <Shield size={22} strokeWidth={2} className="shrink-0 text-accent-hover" />
              <p className="text-sm font-semibold text-accent-hover">
                {netWorth.emergencyFund.name} is marked as your emergency fund — {netWorth.emergencyFund.months} month
                {netWorth.emergencyFund.months === 1 ? "" : "s"} of cover.
              </p>
            </div>
          )}

          {!reordering && archived.length > 0 && (
            <div>
              <h2 className="mb-2.5 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Archived</h2>
              <div className="flex flex-col gap-2.5">
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
          <AccountDetails key={selected.id} account={selected} onEdit={() => setMode("edit")} onChanged={close} />
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
