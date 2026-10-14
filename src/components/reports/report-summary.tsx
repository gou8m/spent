import { formatMoney } from "@/lib/money";

/** Three equal-width tiles share one row, so a long figure (a 6+ digit
 * balance, a currency with no "K"-style compacting) needs to shrink rather
 * than truncate into an unreadable ellipsis — same length-based step-down
 * already used for the transaction form's live amount input. */
function amountSizeClass(text: string) {
  if (text.length > 9) return "text-sm";
  if (text.length > 7) return "text-base";
  if (text.length > 5) return "text-lg";
  return "text-[1.375rem]";
}

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
  const savedPercent = income > 0 ? Math.round((savings / income) * 100) : 0;
  // Display-only rounding — the income/expense/savings figures themselves
  // stay exact integer minor units throughout; this just drops the cents
  // from these three headline tiles so they read cleanly at a glance.
  const incomeText = formatMoney(income, currency, undefined, { decimals: 0 });
  const expenseText = formatMoney(expense, currency, undefined, { decimals: 0 });
  const savedText = `${savedPercent}%`;

  return (
    <div className="flex gap-2.5">
      <div className="min-w-0 flex-[1.3] rounded-lg p-3.5" style={{ background: "var(--hero-gradient)" }}>
        <p className="text-xs font-bold text-hero-text-secondary">Income</p>
        <p className={`mt-1 truncate font-extrabold tracking-tight text-hero-text ${amountSizeClass(incomeText)}`}>{incomeText}</p>
      </div>
      <div className="min-w-0 flex-[1.3] rounded-lg bg-surface-2 p-3.5">
        <p className="text-xs font-bold text-text-secondary">Spent</p>
        <p className={`mt-1 truncate font-extrabold tracking-tight text-text-primary ${amountSizeClass(expenseText)}`}>{expenseText}</p>
      </div>
      <div className="min-w-0 flex-1 rounded-lg bg-sky p-3.5">
        <p className="text-xs font-bold text-sky-text-secondary">Saved</p>
        <p className={`mt-1 truncate font-extrabold tracking-tight text-sky-text ${amountSizeClass(savedText)}`}>{savedText}</p>
      </div>
    </div>
  );
}
