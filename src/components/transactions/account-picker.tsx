"use client";

import { useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { IconChip } from "@/components/ui/icon-chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatMoney } from "@/lib/money";

export interface AccountOption {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  currency: string;
  balance: number;
}

/** Types that hold savings/investment money rather than everyday spending
 * money — picking one for an expense/income/transfer is unusual enough (and
 * throws off their tracked growth) that it's worth a confirmation instead of
 * silently accepting it. */
const CONFIRM_TYPES = new Set(["SAVINGS", "INVESTMENT"]);

export function AccountPicker({
  accounts,
  value,
  onChange,
  placeholder = "Choose an account",
  exclude,
}: {
  accounts: AccountOption[];
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder?: string;
  exclude?: string;
}) {
  const options = exclude ? accounts.filter((a) => a.id !== exclude) : accounts;
  const [pending, setPending] = useState<AccountOption | null>(null);

  function handleValueChange(id: string) {
    const account = options.find((a) => a.id === id);
    if (account && CONFIRM_TYPES.has(account.type)) {
      setPending(account);
      return;
    }
    onChange(id);
  }

  return (
    <>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <IconChip icon={account.icon} color={account.color} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col items-start">
                  <span className="w-full truncate text-left">{account.name}</span>
                  <span className="w-full truncate text-left font-numeric text-xs text-text-muted">
                    {formatMoney(account.balance, account.currency)}
                  </span>
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
        title="Use this account?"
        description={`"${pending?.name}" is a ${pending?.type === "SAVINGS" ? "savings" : "investment"} account. Recording this transaction against it will affect its tracked balance.`}
        confirmLabel="Use it"
        onConfirm={() => {
          if (pending) onChange(pending.id);
          setPending(null);
        }}
      />
    </>
  );
}
