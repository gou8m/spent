import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";

export interface AccountAnalysisRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  currency: string;
  balance: number;
  incomeInRange: number;
  expenseInRange: number;
  netInRange: number;
}

export function AccountAnalysis({ accounts }: { accounts: AccountAnalysisRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>By account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-2">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center gap-3 rounded-2xl px-1 py-3">
            <IconChip icon={account.icon} color={account.color} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{account.name}</p>
              <p className="text-xs text-text-muted">
                <span className="text-income">+{formatMoney(account.incomeInRange, account.currency, "en-US", { compact: true })}</span>
                {" · "}
                <span className="text-expense">-{formatMoney(account.expenseInRange, account.currency, "en-US", { compact: true })}</span>
                {" in this period"}
              </p>
            </div>
            <Amount value={account.balance} currency={account.currency} size="sm" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
