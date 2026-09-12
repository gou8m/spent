"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { MOBILE_NAV_ITEMS, type NavItem } from "@/lib/nav";
import { useTransactionSheet } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const openTransactionSheet = useTransactionSheet((s) => s.open);

  const [left, right] = [MOBILE_NAV_ITEMS.slice(0, 2), MOBILE_NAV_ITEMS.slice(2, 4)];

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-w-16 flex-col items-center gap-1 rounded-lg py-1.5 text-[0.6875rem] font-medium transition-colors",
          active ? "text-accent-text" : "text-text-muted",
        )}
      >
        <item.icon size={21} strokeWidth={active ? 2.25 : 2} />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-2 pt-1.5">
        {left.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <button
          onClick={() => openTransactionSheet()}
          aria-label="Add transaction"
          className="relative -top-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-text-on-accent shadow-lg transition-transform active:scale-95"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        {right.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>
    </nav>
  );
}
