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
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <span className="flex flex-col items-center rounded-2xl bg-white/20 px-3 py-2 text-center dark:bg-black/10">
          <span className="text-[0.6875rem] font-semibold opacity-85">Income</span>
          <span className="text-[0.9375rem] font-bold">+{formatMoney(income, currency)}</span>
        </span>
        <span className="flex flex-col items-center rounded-2xl bg-white/20 px-3 py-2 text-center dark:bg-black/10">
          <span className="text-[0.6875rem] font-semibold opacity-85">Spent</span>
          <span className="text-[0.9375rem] font-bold">-{formatMoney(expense, currency)}</span>
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
