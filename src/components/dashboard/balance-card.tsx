import { ArrowDownRight, ArrowUpRight, PiggyBank } from "lucide-react";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";

export function BalanceCard({
  balance,
  income,
  expense,
  savings,
  currency,
}: {
  balance: number;
  income: number;
  expense: number;
  savings: number;
  currency: string;
}) {
  const stats = [
    { label: "Income", value: income, icon: ArrowUpRight, tone: "text-income", bg: "bg-income-subtle" },
    { label: "Expenses", value: expense, icon: ArrowDownRight, tone: "text-expense", bg: "bg-expense-subtle" },
    { label: "Saved", value: savings, icon: PiggyBank, tone: "text-savings", bg: "bg-savings-subtle" },
  ] as const;

  return (
    <Card className="overflow-hidden">
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <p className="text-[0.8125rem] font-medium text-text-secondary">Total balance</p>
        <Amount value={balance} currency={currency} size="lg" className="mt-1 block" />
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-divider border-t border-border">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-start gap-1.5 px-4 py-3.5 sm:px-6">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full ${stat.bg} ${stat.tone}`}>
              <stat.icon size={14} strokeWidth={2.25} />
            </span>
            <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-muted">{stat.label}</span>
            <Amount value={stat.value} currency={currency} size="sm" className="text-text-primary" />
          </div>
        ))}
      </div>
    </Card>
  );
}
