"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useTransactionSheet } from "@/stores/ui-store";
import { FAB_HREFS } from "@/lib/nav-chrome";
import { cn } from "@/lib/utils";

/** The floating Add button — a separate element from the bottom tab bar, not
 * one of its tabs. 64px on Home, 56px everywhere else (scaled down from the reference at the user's request) it appears (Transactions,
 * Budgets, Goals); hidden on every other route (forms, sheets, Settings, and
 * every "back" sub-page). */
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
      className={cn(
        "safe-bottom fixed right-6 z-30 flex items-center justify-center rounded-[20px] bg-accent text-text-on-accent shadow-[0_10px_24px_rgba(27,107,51,0.35)] transition-transform active:scale-95 md:hidden",
        isHome ? "bottom-26 h-16 w-16" : "bottom-24 h-14 w-14",
      )}
    >
      <Plus size={isHome ? 26 : 24} strokeWidth={2.5} />
    </button>
  );
}
