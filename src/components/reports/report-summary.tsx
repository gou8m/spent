import { ArrowDownLeft, ArrowUpRight, Coins } from "lucide-react";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";

export function ReportSummary({
  income,
  expense,
  savings,
  currency,
}: {
  income: number;
  expense: number;
  savings: number;
  currency: string;
}) {
  const stats = [
    { label: "Income", value: income, icon: ArrowDownLeft, tone: "text-income", bg: "bg-income-subtle" },
    { label: "Expenses", value: expense, icon: ArrowUpRight, tone: "text-expense", bg: "bg-expense-subtle" },
    { label: "Saved", value: savings, icon: Coins, tone: "text-savings", bg: "bg-savings-subtle" },
  ] as const;

  return (
    <Card className="grid grid-cols-3 gap-2 p-2">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col items-start gap-1.5 rounded-2xl px-3 py-3 sm:px-4">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full ${stat.bg} ${stat.tone}`}>
            <stat.icon size={14} strokeWidth={2.25} />
          </span>
          <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-muted">{stat.label}</span>
          <Amount value={stat.value} currency={currency} size="sm" className="text-text-primary" />
        </div>
      ))}
    </Card>
  );
}
