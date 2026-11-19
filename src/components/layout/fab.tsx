"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useTransactionSheet } from "@/stores/ui-store";
import { FAB_HREFS } from "@/lib/nav-chrome";
import { cn } from "@/lib/utils";

/**
 * The floating Add button, a separate element from the bottom tab bar. 64px on Home, 56px elsewhere; it
 * appears only on Home and Transactions. While a new transaction is being entered it turns into an X (the
 * plus rotates a quarter turn), drops to the bottom corner and stays above the sheet: tapping it discards
 * the entry, the same as tapping outside the sheet. Saving closes the sheet and it turns back into a plus.
 */
export function Fab() {
  const pathname = usePathname();
  const { isOpen, editingTransactionId, open, close } = useTransactionSheet();

  if (!FAB_HREFS.has(pathname)) return null;
  const isHome = pathname === "/dashboard";
  const adding = isOpen && !editingTransactionId;

  return (
    <button
      type="button"
      data-keep-open
      onClick={() => (adding ? close() : open())}
      aria-label={adding ? "Discard and close" : "Add transaction"}
      // Follows the bottom bar as it slides away on scroll, at the same speed, and stops at the
      // bottom corner (the bar keeps going); both come back together on scroll up. While adding it
      // settles into the very corner. `pointer-events: auto` because an open sheet makes everything
      // outside itself inert, and this button must stay tappable above it.
      style={{
        transform: adding ? "translateY(4.5rem)" : `translateY(min(var(--nav-offset, 0px), ${isHome ? "92px" : "88px"}))`,
        pointerEvents: "auto",
      }}
      className={cn(
        "fixed right-6 flex items-center justify-center rounded-[20px] bg-accent text-text-on-accent shadow-[0_10px_24px_color-mix(in_srgb,var(--accent)_35%,transparent)] will-change-transform transition-[transform,scale,border-radius,box-shadow] duration-[480ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 md:hidden",
        adding ? "z-[60] rounded-[18px] shadow-[0_6px_16px_color-mix(in_srgb,var(--accent)_30%,transparent)]" : "z-30",
        isHome ? "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] h-16 w-16" : "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] h-14 w-14",
      )}
    >
      <Plus size={isHome ? 26 : 24} strokeWidth={2.5} className={cn("transition-transform duration-[480ms] ease-[cubic-bezier(0.32,0.72,0,1)]", adding && "rotate-[225deg]")} />
    </button>
  );
}
