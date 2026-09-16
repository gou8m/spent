"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { NAV_ITEMS, PROFILE_NAV_ITEM, type NavItem } from "@/lib/nav";
import { useTransactionSheet } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
        active ? "bg-accent-subtle text-accent-text shadow-xs backdrop-blur-sm" : "text-text-muted",
      )}
    >
      <item.icon size={21} strokeWidth={active ? 2.25 : 2} />
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const openTransactionSheet = useTransactionSheet((s) => s.open);

  const [left, right] = [NAV_ITEMS.slice(0, 2), NAV_ITEMS.slice(2, 3)];

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-3 z-30 flex justify-center px-3 md:hidden">
      <div className="flex items-center justify-center gap-2 rounded-full bg-surface px-4 py-1.5 shadow-lg">
        {left.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        <button
          onClick={() => openTransactionSheet()}
          aria-label="Add transaction"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-text-on-accent shadow-md transition-transform active:scale-95"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>

        {right.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        <NavLink item={PROFILE_NAV_ITEM} pathname={pathname} />
      </div>
    </nav>
  );
}
