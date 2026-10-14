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
  return (
    <div className="rounded-2xl px-6 py-7" style={{ background: "var(--hero-gradient)" }}>
      <Link href="/accounts" className="block">
        <p className="text-base font-semibold text-hero-text-secondary">Total Balance</p>
        <Amount value={balance} currency={currency} size="lg" className="mt-2.5 block text-hero-text" />
      </Link>
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <span className="rounded-full bg-white/55 px-3 py-1.5 text-[0.8125rem] font-bold text-hero-text-secondary dark:bg-white/[0.14]">
          +{formatMoney(income, currency)} income
        </span>
        <span className="rounded-full bg-white/55 px-3 py-1.5 text-[0.8125rem] font-bold text-hero-text-secondary dark:bg-white/[0.14]">
          -{formatMoney(expense, currency)} spent
        </span>
      </div>

      {otherBalances.length > 0 && (
        <p className="mt-3.5 text-xs font-medium leading-relaxed text-hero-text-secondary">
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
