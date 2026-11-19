"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/** The four bottom-bar tabs, left to right. Swiping on one of these screens moves to its neighbour. */
const TABS = ["/dashboard", "/transactions", "/accounts", "/profile"];

const MIN_DISTANCE = 72; // px of horizontal travel
const DOMINANCE = 1.8; // horizontal travel must beat vertical by this factor, so scrolling is never mistaken for a swipe
const MAX_MS = 700;

/** True if the touch started somewhere that scrolls or edits sideways on its own (carousels, chart, inputs). */
function ownsHorizontalGesture(start: EventTarget | null): boolean {
  let el = start instanceof Element ? start : null;
  while (el && el !== document.body) {
    if (el.matches("input, textarea, select, [contenteditable=true], [data-no-swipe]")) return true;
    const style = getComputedStyle(el);
    if ((style.overflowX === "auto" || style.overflowX === "scroll") && el.scrollWidth > el.clientWidth + 1) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Swipe left or right on Home, Transactions, Accounts or Settings to go to the next or previous tab, in the
 * bottom bar's order. Phones only (touch events); ignored while a sheet or dialog is open, when the touch
 * starts on something that scrolls sideways, or when the movement is mostly vertical.
 */
export function TabSwipe() {
  const pathname = usePathname();
  const router = useRouter();
  const index = TABS.indexOf(pathname);
  const start = useRef<{ x: number; y: number; t: number; ok: boolean } | null>(null);

  useEffect(() => {
    if (index === -1) return;

    function onStart(e: TouchEvent) {
      if (e.touches.length !== 1 || document.querySelector("[role=dialog], [role=alertdialog]")) {
        start.current = null;
        return;
      }
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY, t: Date.now(), ok: !ownsHorizontalGesture(e.target) };
    }

    function onEnd(e: TouchEvent) {
      const s = start.current;
      start.current = null;
      if (!s || !s.ok || e.changedTouches.length === 0) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (Date.now() - s.t > MAX_MS || Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * DOMINANCE) return;
      const next = TABS[index + (dx < 0 ? 1 : -1)];
      if (!next) return;
      // A light tick, where the browser allows it.
      if ("vibrate" in navigator) navigator.vibrate(8);
      router.push(next);
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [index, router]);

  return null;
}
