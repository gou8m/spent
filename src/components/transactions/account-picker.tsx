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
  allowExpense: boolean;
  isEmergencyFund: boolean;
  icon: string;
  color: string;
  currency: string;
  balance: number;
}

/** Types that hold investment money rather than everyday spending money —
 * picking one for an expense/income/transfer is unusual enough (and throws
 * off its tracked growth) that it's worth a confirmation instead of silently
 * accepting it. SAVINGS ("Emergency Fund") accounts don't go through this —
 * they're filtered out of the expense list entirely instead when their own
 * `allowExpense` is off, see `forExpense` below. */
const CONFIRM_TYPES = new Set(["INVESTMENT"]);

export function AccountPicker({
  accounts,
  value,
  onChange,
  placeholder = "Choose an account",
  exclude,
  forExpense = false,
  error = false,
}: {
  accounts: AccountOption[];
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder?: string;
  exclude?: string;
  /** When true, hides SAVINGS ("Emergency Fund") accounts that have opted out of
   * everyday spending — pass this only for the account picker on an EXPENSE
   * transaction/recurring rule. */
  forExpense?: boolean;
  /** Same red-ring treatment `Input`/`CategoryPicker` use — set when a submit
   * attempt failed because no account was chosen. */
  error?: boolean;
}) {
  // `exclude` (a transfer's own source/destination account) is a real removal — that
  // account can never legitimately be this field's value, so Radix never needs to know
  // about it. `forExpense` is different: RecurringForm can programmatically pick an
  // Emergency Fund account for an EXPENSE rule even though it opted out of the everyday
  // list, so that item always stays *mounted* (as a hidden, disabled SelectItem) rather
  // than removed — Radix mirrors every SelectItem into a hidden native <select> for form
  // bubbling, and assigning a value with no matching <option> there makes the browser
  // silently reset it to "", which Radix then propagates back up as onValueChange(""),
  // wiping out the very selection we just made.
  const options = accounts.filter((a) => a.id !== exclude);
  const [pending, setPending] = useState<AccountOption | null>(null);
  const selected = accounts.find((a) => a.id === value);

  function isDisallowedForExpense(account: AccountOption) {
    return forExpense && account.type === "SAVINGS" && !account.allowExpense && account.id !== value;
  }

  function handleValueChange(id: string) {
    const account = options.find((a) => a.id === id);
    if (!account || isDisallowedForExpense(account)) return;
    if (CONFIRM_TYPES.has(account.type)) {
      setPending(account);
      return;
    }
    onChange(id);
  }

  return (
    <>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className={error ? "ring-2 ring-error/40" : undefined}>
          <SelectValue placeholder={placeholder}>
            {selected && (
              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <IconChip icon={selected.icon} color={selected.color} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col items-start">
                  <span className="w-full truncate text-left">{selected.name}</span>
                  <span className="w-full truncate text-left font-numeric text-xs text-text-muted">
                    {formatMoney(selected.balance, selected.currency)}
                  </span>
                </span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((account) => {
            const hidden = isDisallowedForExpense(account);
            return (
              <SelectItem key={account.id} value={account.id} disabled={hidden} className={hidden ? "hidden" : undefined}>
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
            );
          })}
        </SelectContent>
      </Select>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
        title="Use this account?"
        description={`"${pending?.name}" is an investment account. Recording this transaction against it will affect its tracked balance.`}
        confirmLabel="Use it"
        onConfirm={() => {
          if (pending) onChange(pending.id);
          setPending(null);
        }}
      />
    </>
  );
}
