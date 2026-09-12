import type { LucideIcon } from "lucide-react";
import { LayoutGrid, ArrowLeftRight, Wallet, PiggyBank, Settings } from "lucide-react";

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
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Bottom nav has room for 4 destinations around the center add-button — the
 * two most frequent are placed on each side; Settings moves to the mobile
 * header instead since it's a low-frequency destination. */
export const MOBILE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => item.href !== "/settings");
