"use client";

import { Info } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CURRENCIES, MAX_CURRENCY_CHANGES, SUPPORT_EMAIL } from "@/lib/constants";

export function CurrencyInfo({ currency, remaining }: { currency: string; remaining: number }) {
  const name = CURRENCIES.find((c) => c.code === currency)?.name ?? currency;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="About primary currency"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-secondary"
        >
          <Info size={14} strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3.5 text-sm leading-relaxed text-text-secondary" align="start">
        This is your primary currency, set to{" "}
        <span className="font-medium text-text-primary">
          {currency} ({name})
        </span>
        . You can change it {MAX_CURRENCY_CHANGES} times — you have{" "}
        <span className="font-medium text-text-primary">{remaining}</span> left.
        {remaining === 0 && (
          <>
            {" "}
            Need it changed again?{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-accent-text hover:underline">
              Contact us
            </a>
            .
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
