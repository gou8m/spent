"use client";

import { useLayoutEffect, useState, type ChangeEvent } from "react";
import { caretAfter, countSignificant, formatAmountText, sanitizeAmount } from "@/lib/amount-input";

/**
 * Wires an amount box to plain-number state while showing grouping commas for the currency as you type,
 * and keeps the caret where it was (so editing in the middle of "1,23,456" does not jump to the end).
 * Pass `attach` as the input's `ref` prop (it is a callback ref).
 */
export function useAmountField(raw: string, setRaw: (value: string) => void, currency: string) {
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  // Where the caret should land once the new text is on screen (set by a change, used right after it renders).
  const [pendingCaret, setPendingCaret] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (pendingCaret !== null && input && document.activeElement === input) {
      input.setSelectionRange(pendingCaret, pendingCaret);
    }
  }, [pendingCaret, input, raw]);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const before = countSignificant(el.value.slice(0, el.selectionStart ?? el.value.length));
    const next = sanitizeAmount(el.value, currency);
    setRaw(next);
    setPendingCaret(caretAfter(formatAmountText(next, currency), before));
  }

  return { attach: setInput, value: formatAmountText(raw, currency), onChange };
}
