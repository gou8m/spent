import { ArrowDownLeft, ArrowUpRight, ChevronDown, Coins } from "lucide-react";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { InfoPopover } from "@/components/ui/info-popover";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export function BalanceCard({
  balance,
  netWorth,
  income,
  expense,
  savings,
  currency,
  otherBalances = [],
}: {
  balance: number;
  /** Total balance converted into `currency`, including other-currency accounts via a
   * live exchange rate — null when a rate couldn't be fetched (never shown as a guess). */
  netWorth?: number | null;
  income: number;
  expense: number;
  savings: number;
  currency: string;
  otherBalances?: { currency: string; balance: number }[];
}) {
  const showNetWorth = netWorth != null && otherBalances.length > 0 && netWorth !== balance;
  const stats = [
    { label: "Income", value: income, icon: ArrowDownLeft, tone: "text-income", bg: "bg-income-subtle" },
    { label: "Expenses", value: expense, icon: ArrowUpRight, tone: "text-expense", bg: "bg-expense-subtle" },
    { label: "Saved", value: savings, icon: Coins, tone: "text-savings", bg: "bg-savings-subtle" },
  ] as const;

  return (
    <Card className="overflow-hidden">
      <div className="px-6 pt-6">
        <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-muted">Total balance</p>
        <Amount value={balance} currency={currency} size="lg" className="mt-1 block" />

        {showNetWorth && (
          <div className="mt-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-muted">Total net worth</span>
              <InfoPopover label="Total net worth">
                Your total balance plus every other-currency account, converted into {currency} using a live exchange
                rate. This figure isn&apos;t shown if a rate can&apos;t be fetched right now.
              </InfoPopover>
            </div>
            <Amount value={netWorth!} currency={currency} size="sm" className="font-medium text-text-secondary" />
          </div>
        )}

        {otherBalances.length > 0 && (
          <div className="mt-3">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-3"
                >
                  <span className="uppercase tracking-wide text-text-muted">Other balances</span>
                  <span className="text-text-primary">{otherBalances.length}</span>
                  <ChevronDown size={12} strokeWidth={2.25} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <ul>
                  {otherBalances.map((b) => (
                    <li key={b.currency} className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2">
                      <span className="text-sm text-text-muted">{b.currency}</span>
                      <Amount value={b.balance} currency={b.currency} size="sm" className="font-medium text-text-primary" />
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
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
