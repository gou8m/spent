"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { IconChip } from "@/components/ui/icon-chip";
import { formatMoney } from "@/lib/money";

export interface AccountOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  currency: string;
  balance: number;
}

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

  return (
    <Select value={value} onValueChange={onChange}>
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
  );
}
