import Link from "next/link";
import { Amount } from "@/components/ui/amount";
import { formatMoney } from "@/lib/money";

export function BalanceCard({
  balance,
  income,
  expense,
  currency,
  netWorth,
  otherBalances = [],
}: {
  balance: number;
  income: number;
  expense: number;
  currency: string;
  /** Total balance converted into `currency`, including other-currency accounts via a
   * live exchange rate — null when a rate couldn't be fetched (never shown as a guess). */
  netWorth?: number | null;
  otherBalances?: { currency: string; balance: number }[];
}) {
  // Same colour as the floating + button (the accent), in both themes.
  return (
    <div className="rounded-2xl bg-accent px-6 py-7 text-text-on-accent">
      <Link href="/accounts" className="block">
        <p className="text-base font-semibold opacity-85">Total Balance</p>
        <Amount value={balance} currency={currency} size="lg" className="mt-2.5 block text-text-on-accent" />
      </Link>
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <span className="rounded-full bg-white/20 px-3 py-1.5 text-[0.8125rem] font-bold dark:bg-black/10">
          +{formatMoney(income, currency)} income
        </span>
        <span className="rounded-full bg-white/20 px-3 py-1.5 text-[0.8125rem] font-bold dark:bg-black/10">
          -{formatMoney(expense, currency)} spent
        </span>
      </div>

      {otherBalances.length > 0 && (
        <p className="mt-3.5 text-xs font-medium leading-relaxed opacity-85">
          {netWorth != null ? (
            <>
              Net worth across currencies: {formatMoney(netWorth, currency)} · also holding{" "}
              {otherBalances.map((b) => formatMoney(b.balance, b.currency)).join(", ")}
            </>
          ) : (
            <>Also holding {otherBalances.map((b) => formatMoney(b.balance, b.currency)).join(", ")} — live rates unavailable right now.</>
          )}
        </p>
      )}
    </div>
  );
}
