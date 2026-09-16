import type { LucideIcon } from "lucide-react";
import { LayoutGrid, ArrowLeftRight, Wallet, Calculator, Repeat, Target, BarChart3, DatabaseBackup, User, Tags } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Primary destinations — surfaced directly in both the desktop sidebar and the
 * mobile bottom nav (alongside the center Add button and, on mobile, a dedicated
 * Profile slot — see PROFILE_NAV_ITEM). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/accounts", label: "Accounts", icon: Wallet },
];

/** Everything else finance-related — a labeled "Finance" section under the
 * desktop sidebar's primary links, and the same list inside the mobile
 * hamburger menu. One shared source so the two surfaces can't drift apart.
 * Deliberately excludes Accounts (already a primary item above — listing it
 * again here would be a duplicate nav entry on both surfaces). */
export const FINANCE_NAV_ITEMS: NavItem[] = [
  { href: "/budgets", label: "Budgets", icon: Calculator },
  { href: "/profile/categories", label: "Categories", icon: Tags },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/import-export", label: "Backup & restore", icon: DatabaseBackup },
];

/** The mobile bottom nav's 5th slot (replacing the old "More" grid) — Profile is
 * now a direct destination instead of being buried behind it. */
export const PROFILE_NAV_ITEM: NavItem = { href: "/profile", label: "Profile", icon: User };
