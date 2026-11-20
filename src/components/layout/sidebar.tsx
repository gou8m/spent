"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { NAV_ITEMS, FINANCE_NAV_ITEMS, type NavItem } from "@/lib/nav";
import { useTransactionSheet } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const openTransactionSheet = useTransactionSheet((s) => s.open);

  function renderLink(item: NavItem) {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-11 items-center gap-3 rounded-md px-3.5 text-[0.9375rem] transition-colors",
          active ? "bg-accent-subtle font-bold text-accent-text" : "font-semibold text-text-secondary hover:bg-surface-2 hover:text-text-primary",
        )}
      >
        <item.icon size={22} strokeWidth={2} />
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col border-r border-divider bg-surface px-4 py-6 md:flex">
      <span className="text-[1.875rem] font-extrabold tracking-tight text-accent-text">Spent.</span>

      <nav className="mt-5 flex flex-col gap-1">{NAV_ITEMS.map(renderLink)}</nav>

      <p className="mb-2 ml-3.5 mt-5 text-xs font-bold tracking-wide text-text-secondary">FINANCE</p>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pb-3">{FINANCE_NAV_ITEMS.map(renderLink)}</nav>

      <div className="shrink-0 border-t border-divider pt-4">
        <button
          type="button"
          onClick={() => openTransactionSheet()}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-md bg-accent text-sm font-bold text-text-on-accent transition-colors hover:bg-accent-hover"
        >
          <Plus size={20} strokeWidth={2} />
          Add transaction
        </button>
      </div>
    </aside>
  );
}
