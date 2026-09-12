import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import type { getAccounts } from "@/lib/data/accounts";

export function AccountsStrip({ accounts }: { accounts: Awaited<ReturnType<typeof getAccounts>> }) {
  if (accounts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
        <Link href="/accounts" className="text-sm font-medium text-accent-text hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent className="pt-2">
        <ul className="divide-y divide-divider">
          {accounts.slice(0, 5).map((account) => (
            <li key={account.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <IconChip icon={account.icon} color={account.color} size="sm" />
              <span className="flex-1 truncate text-sm font-medium text-text-primary">{account.name}</span>
              <Amount value={account.balance} currency={account.currency} size="sm" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
