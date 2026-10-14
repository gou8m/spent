import { formatMoney } from "@/lib/money";

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

  return (
    <div className="flex gap-2.5">
      <div className="flex-1 rounded-lg p-3.5" style={{ background: "var(--hero-gradient)" }}>
        <p className="text-xs font-bold text-hero-text-secondary">Income</p>
        <p className="mt-1 text-[1.375rem] font-extrabold tracking-tight text-hero-text">{formatMoney(income, currency)}</p>
      </div>
      <div className="flex-1 rounded-lg bg-surface-2 p-3.5">
        <p className="text-xs font-bold text-text-secondary">Spent</p>
        <p className="mt-1 text-[1.375rem] font-extrabold tracking-tight text-text-primary">{formatMoney(expense, currency)}</p>
      </div>
      <div className="flex-1 rounded-lg bg-sky p-3.5">
        <p className="text-xs font-bold text-sky-text-secondary">Saved</p>
        <p className="mt-1 text-[1.375rem] font-extrabold tracking-tight text-sky-text">{savedPercent}%</p>
      </div>
    </div>
  );
}
