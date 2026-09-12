"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Plus, LogOut } from "lucide-react";
import { signOutAction } from "@/actions/session";
import { NAV_ITEMS } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTransactionSheet } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function Sidebar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();
  const openTransactionSheet = useTransactionSheet((s) => s.open);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-text-on-accent">
          <Wallet size={16} strokeWidth={2.25} />
        </span>
        <span className="text-[1.0625rem] font-bold tracking-tight text-text-primary">Spent</span>
      </div>

      <div className="px-3">
        <button
          onClick={() => openTransactionSheet()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-text-on-accent transition-colors hover:bg-accent-hover"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add transaction
        </button>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-subtle text-accent-text"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
              )}
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{userName}</p>
            <p className="truncate text-xs text-text-muted">{userEmail}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 px-2">
          <ThemeToggle />
          <form action={signOutAction}>
            <button
              type="submit"
              title="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
            >
              <LogOut size={16} strokeWidth={2} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
