"use client";

import { getDenominationsForCurrency, totalFromDenominations, type DenominationCounts } from "@/lib/denominations";
import { formatMoney, toMinorUnits } from "@/lib/money";
import { Label, Input } from "@/components/ui/input";

/** A grid of "how many of each note/coin" count inputs for a given currency —
 * used both for a CASH account's current holdings and for the breakdown of
 * a single expense/income transaction against one. */
export function DenominationInput({
  currency,
  value,
  onChange,
}: {
  currency: string;
  value: DenominationCounts;
  onChange: (value: DenominationCounts) => void;
}) {
  const denominations = getDenominationsForCurrency(currency);
  if (denominations.length === 0) {
    return <p className="text-sm text-text-muted">No denomination data available for {currency}.</p>;
  }

  const total = totalFromDenominations(value);

  function setCount(denom: number, raw: string) {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    const key = String(denom);
    const next = { ...value };
    if (n === 0) delete next[key];
    else next[key] = n;
    onChange(next);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {denominations.map((d) => (
          <div key={d}>
            <Label htmlFor={`denom-${currency}-${d}`} className="text-xs text-text-muted">
              {formatMoney(toMinorUnits(d, currency), currency)}
            </Label>
            <Input
              id={`denom-${currency}-${d}`}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={value[String(d)] ?? ""}
              onChange={(e) => setCount(d, e.target.value)}
              placeholder="0"
              className="h-9 px-3 text-sm"
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-text-secondary">Total: {formatMoney(toMinorUnits(total, currency), currency)}</p>
    </div>
  );
}
