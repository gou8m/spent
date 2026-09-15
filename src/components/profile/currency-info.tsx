"use client";

import { InfoPopover } from "@/components/ui/info-popover";
import { MAX_CURRENCY_CHANGES, SUPPORT_EMAIL } from "@/lib/constants";

export function CurrencyInfo({ remaining }: { remaining: number }) {
  return (
    <InfoPopover label="About primary currency">
      You can change it {MAX_CURRENCY_CHANGES} times — you have{" "}
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
    </InfoPopover>
  );
}
