"use client";

import { ArrowDownLeft, ArrowUpRight, ChevronDown, Coins } from "lucide-react";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { InfoPopover } from "@/components/ui/info-popover";

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
          // A native <details>/<summary> disclosure — same house pattern TransactionList's
          // "Upcoming" box uses — so opening it grows this card in place instead of floating
          // a popover over the stats row below. The (i) button stops its click from bubbling
          // up to <summary>, so it opens its own dialog without also toggling this disclosure.
          // (showNetWorth already implies otherBalances.length > 0, so there's always something to expand.)
          <details className="group mt-2">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted">Total net worth</span>
                  <span onClick={(e) => e.stopPropagation()}>
                    <InfoPopover label="Total net worth">
                      Your total balance plus every other-currency account, converted into {currency} using a live
                      exchange rate. This figure isn&apos;t shown if a rate can&apos;t be fetched right now.
                    </InfoPopover>
                  </span>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-secondary">
                  <span className="uppercase tracking-wide text-text-muted">Other balances</span>
                  <span className="text-text-primary">{otherBalances.length}</span>
                  <ChevronDown size={12} strokeWidth={2.25} className="transition-transform group-open:rotate-180" />
                </span>
              </div>
              <Amount value={netWorth!} currency={currency} size="sm" className="mt-1 block font-medium text-text-secondary" />
            </summary>
            <ul className="mt-2 border-t border-divider pt-2">
              {otherBalances.map((b) => (
                <li key={b.currency} className="flex items-center justify-between gap-3 px-1 py-2">
                  <span className="text-sm text-text-muted">{b.currency}</span>
                  <Amount value={b.balance} currency={b.currency} size="sm" className="font-medium text-text-primary" />
                </li>
              ))}
            </ul>
          </details>
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
