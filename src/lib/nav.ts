import type { ComponentType } from "react";
import { ArrowLeftRight, Wallet, Repeat, BarChart3, DatabaseBackup, Tags } from "lucide-react";
import { HomeIcon, BudgetsIcon, GoalsIcon, SettingsIcon, type NavIconProps } from "@/components/ui/nav-icons";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<NavIconProps>;
}

/** Primary destinations — the mobile bottom nav's four tabs and the desktop
 * sidebar's top nav rows, in the reference's exact order. Transactions and
 * Accounts moved out of this primary set (into FINANCE_NAV_ITEMS below) in
 * favour of Budgets and Goals, matching every bottom-nav screen in the
 * reference. "Settings" is the renamed Profile destination. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/budgets", label: "Budgets", icon: BudgetsIcon },
  { href: "/goals", label: "Goals", icon: GoalsIcon },
  { href: "/profile", label: "Settings", icon: SettingsIcon },
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
