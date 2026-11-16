import type { ComponentType } from "react";
import { History, CreditCard, Repeat, Calculator, Download, Tags } from "lucide-react";
import { HomeIcon, ReportsIcon, GoalsIcon, SettingsIcon, type NavIconProps } from "@/components/ui/nav-icons";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<NavIconProps>;
}

/** Primary destinations — the mobile bottom nav's four tabs and the desktop
 * sidebar's top nav rows, in the reference's exact order. Transactions and
 * Accounts moved out of this primary set (into FINANCE_NAV_ITEMS below) in
 * favour of Reports and Accounts (Budgets and Goals moved to the Finance list
 * at the user's request; the reference showed Budgets and Goals as tabs). "Settings" is the renamed Profile destination. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/reports", label: "Reports", icon: ReportsIcon },
  { href: "/accounts", label: "Accounts", icon: CreditCard },
  { href: "/profile", label: "Settings", icon: SettingsIcon },
];

/** Everything else finance-related — a labeled "Finance" section under the
 * desktop sidebar's primary links, and the same grouping Settings' own
 * Finance list (`/profile`) reads from. Order matches the reference desktop
 * sidebar exactly. */
export const FINANCE_NAV_ITEMS: NavItem[] = [
  { href: "/budgets", label: "Budgets", icon: Calculator },
  { href: "/transactions", label: "Transactions", icon: History },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/goals", label: "Goals", icon: GoalsIcon },
  { href: "/profile/categories", label: "Categories", icon: Tags },
  { href: "/import-export", label: "Backup & restore", icon: Download },
];
