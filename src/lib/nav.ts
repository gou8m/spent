import type { LucideIcon } from "lucide-react";
import { LayoutGrid, ArrowLeftRight, Wallet, PiggyBank, Repeat, Target, BarChart3, ArrowDownUp, User } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/profile", label: "Profile", icon: User },
];

/** Bottom nav (mobile) surfaces only the 3 most frequent destinations
 * directly, plus the center add-button — everything else lives behind a
 * "More" grid (see MOBILE_MORE_ITEMS) instead of competing for icon slots. */
const MOBILE_PRIMARY_HREFS = new Set(["/dashboard", "/transactions", "/accounts"]);
export const MOBILE_PRIMARY_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => MOBILE_PRIMARY_HREFS.has(item.href));

/** Everything reachable from the bottom nav's "More" sheet. Profile is
 * deliberately last (bottom-right of the grid). */
export const MOBILE_MORE_ITEMS: NavItem[] = [
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/import-export", label: "Import & export", icon: ArrowDownUp },
  { href: "/profile", label: "Profile", icon: User },
];
