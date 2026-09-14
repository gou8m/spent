import { ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";

export function BalanceCard({
  balance,
  income,
  expense,
  savings,
  currency,
  otherBalances = [],
}: {
  balance: number;
  income: number;
  expense: number;
  savings: number;
  currency: string;
  otherBalances?: { currency: string; balance: number }[];
}) {
  const stats = [
    { label: "Income", value: income, icon: ArrowDownLeft, tone: "text-income", bg: "bg-income-subtle" },
    { label: "Expenses", value: expense, icon: ArrowUpRight, tone: "text-expense", bg: "bg-expense-subtle" },
    { label: "Saved", value: savings, icon: PiggyBank, tone: "text-savings", bg: "bg-savings-subtle" },
  ] as const;

  return (
    <Card className="overflow-hidden">
      <div className="px-6 pt-6">
        <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-muted">Total balance</p>
        <Amount value={balance} currency={currency} size="lg" className="mt-1 block" />

        {otherBalances.length > 0 && (
          <div className="mt-3">
            <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-muted">Other balances</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {otherBalances.map((b) => (
                <span
                  key={b.currency}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium"
                >
                  <Amount value={b.balance} currency={b.currency} size="sm" className="text-text-primary" />
                  <span className="text-text-muted">{b.currency}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mx-2 mb-2 mt-6 grid grid-cols-3 gap-2 rounded-lg bg-surface-2/60 p-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 text-center sm:px-4">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${stat.bg} ${stat.tone}`}>
              <stat.icon size={15} strokeWidth={2} />
            </span>
            <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-muted">{stat.label}</span>
            <Amount value={stat.value} currency={currency} size="sm" className="font-semibold text-text-primary" />
          </div>
        ))}
      </div>
    </Card>
  );
}
