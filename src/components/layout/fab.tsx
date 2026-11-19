"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useTransactionSheet } from "@/stores/ui-store";
import { FAB_HREFS } from "@/lib/nav-chrome";
import { cn } from "@/lib/utils";

/**
 * The floating Add button, a separate element from the bottom tab bar. 64px on Home, 56px elsewhere; it
 * appears only on Home and Transactions and opens the new-transaction sheet.
 */
export function Fab() {
  const pathname = usePathname();
  const open = useTransactionSheet((s) => s.open);

  if (!FAB_HREFS.has(pathname)) return null;
  const isHome = pathname === "/dashboard";

  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label="Add transaction"
      // Follows the bottom bar as it slides away on scroll, at the same speed, and stops a little above
      // the bottom edge (the bar keeps going); both come back together on scroll up.
      style={{ transform: `translateY(min(var(--nav-offset, 0px), ${isHome ? "72px" : "68px"}))` }}
      className={cn(
        "fixed right-6 z-30 flex items-center justify-center rounded-[20px] bg-accent text-text-on-accent shadow-[0_10px_24px_color-mix(in_srgb,var(--accent)_35%,transparent)] will-change-transform active:scale-95 md:hidden",
        isHome ? "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] h-16 w-16" : "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] h-14 w-14",
      )}
    >
      <Plus size={isHome ? 26 : 24} strokeWidth={2.5} />
    </button>
  );
}
