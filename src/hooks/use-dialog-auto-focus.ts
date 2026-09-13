"use client";

import { useRef } from "react";

/**
 * Radix Dialog auto-focuses the first focusable descendant — usually a text
 * input — the instant it opens. On mobile that pops the on-screen keyboard
 * mid-animation, fighting the dialog's own open transition and making it
 * hard to navigate. Focusing the dialog container instead keeps keyboard/
 * screen-reader users landing inside the dialog, but the on-screen keyboard
 * only appears once someone actually taps a field.
 */
export function useDialogAutoFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  function onOpenAutoFocus(e: Event) {
    e.preventDefault();
    ref.current?.focus({ preventScroll: true });
  }

  return { ref, onOpenAutoFocus };
}
