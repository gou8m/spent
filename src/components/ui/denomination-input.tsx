"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { getDenominationsForCurrency, totalFromDenominations, type DenominationCounts } from "@/lib/denominations";
import { formatMoney, toMinorUnits } from "@/lib/money";

/**
 * A horizontally scrollable strip of "denomination × count [Save]" chips —
 * one per note/coin value for the currency, minus whichever ones are
 * already saved (a saved denomination moves down into the "Denominations
 * available" list and disappears from the picker; removing it there brings
 * it back up here). Typing a count doesn't touch `value` until that
 * denomination's own Save is tapped, at which point it's committed.
 * Nothing here is persisted on its own — `value`/`onChange` is just local
 * state the enclosing form saves along with everything else when its own
 * Save/Add button is pressed.
 */
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
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (denominations.length === 0) {
    return <p className="text-sm text-text-muted">No denomination data available for {currency}.</p>;
  }

  function draftFor(denom: number): string {
    const key = String(denom);
    return drafts[key] ?? (value[key] !== undefined ? String(value[key]) : "");
  }

  function setDraft(denom: number, raw: string) {
    const key = String(denom);
    setDrafts((d) => ({ ...d, [key]: raw.replace(/[^0-9]/g, "") }));
  }

  function saveDenomination(denom: number) {
    const key = String(denom);
    const n = Math.max(0, Math.floor(Number(draftFor(denom)) || 0));
    const next = { ...value };
    if (n === 0) delete next[key];
    else next[key] = n;
    onChange(next);
    setDrafts((d) => {
      const copy = { ...d };
      delete copy[key];
      return copy;
    });
  }

  function removeDenomination(denom: number) {
    const key = String(denom);
    const next = { ...value };
    delete next[key];
    onChange(next);
    setDrafts((d) => {
      const copy = { ...d };
      delete copy[key];
      return copy;
    });
  }

  const savedEntries = Object.entries(value).sort((a, b) => Number(b[0]) - Number(a[0]));
  const total = totalFromDenominations(value);
  const availableDenominations = denominations.filter((d) => value[String(d)] === undefined);

  return (
    <div className="space-y-3">
      {availableDenominations.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {availableDenominations.map((d) => (
            <div key={d} className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-2 py-1.5 pl-3.5 pr-1.5">
              <span className="whitespace-nowrap text-sm font-medium text-text-primary">
                {formatMoney(toMinorUnits(d, currency), currency)}
              </span>
              <span className="text-text-muted" aria-hidden="true">
                ×
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={draftFor(d)}
                onChange={(e) => setDraft(d, e.target.value)}
                placeholder="0"
                aria-label={`Count for ${formatMoney(toMinorUnits(d, currency), currency)}`}
                className="h-8 w-14 rounded-full bg-surface px-2 text-center text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-subtle"
              />
              <button
                type="button"
                onClick={() => saveDenomination(d)}
                aria-label={`Save ${formatMoney(toMinorUnits(d, currency), currency)} count`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-text-on-accent transition-colors hover:bg-accent-hover"
              >
                <Check size={14} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {savedEntries.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-text-secondary">Denominations available</p>
          <div className="flex flex-wrap gap-1.5">
            {savedEntries.map(([denomValue, count]) => (
              <span
                key={denomValue}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-primary"
              >
                {formatMoney(toMinorUnits(Number(denomValue), currency), currency)} × {count}
                <button
                  type="button"
                  onClick={() => removeDenomination(Number(denomValue))}
                  aria-label={`Remove ${formatMoney(toMinorUnits(Number(denomValue), currency), currency)} entry`}
                  className="text-text-muted transition-colors hover:text-error"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-secondary">Total: {formatMoney(toMinorUnits(total, currency), currency)}</p>
        </div>
      )}
    </div>
  );
}
