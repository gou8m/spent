import type { LucideIcon } from "lucide-react";
import { Home, ArrowLeftRight, Wallet, Calculator, Repeat, Target, BarChart3, DatabaseBackup, SlidersHorizontal, Tags } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Primary destinations — the mobile bottom nav's four tabs and the desktop
 * sidebar's top nav rows, in the reference's exact order. Transactions and
 * Accounts moved out of this primary set (into FINANCE_NAV_ITEMS below) in
 * favour of Budgets and Goals, matching every bottom-nav screen in the
 * reference. "Settings" is the renamed Profile destination. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/budgets", label: "Budgets", icon: Calculator },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/profile", label: "Settings", icon: SlidersHorizontal },
];

/** Everything else finance-related — a labeled "Finance" section under the
 * desktop sidebar's primary links, and the same grouping Settings' own
 * Finance list (`/profile`) reads from. Order matches the reference desktop
 * sidebar exactly. */
export const FINANCE_NAV_ITEMS: NavItem[] = [
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/profile/categories", label: "Categories", icon: Tags },
  { href: "/import-export", label: "Backup & restore", icon: DatabaseBackup },
];
