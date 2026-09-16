"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, LogOut } from "lucide-react";
import { signOutAction } from "@/actions/session";
import { NAV_ITEMS, FINANCE_NAV_ITEMS, type NavItem } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useTransactionSheet } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/lib/data/notifications";

export function Sidebar({
  userName,
  userEmail,
  avatar,
  notifications,
  isVerified,
}: {
  userName: string;
  userEmail: string;
  avatar: string;
  notifications: AppNotification[];
  isVerified: boolean;
}) {
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
          "flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-accent-subtle text-accent-text"
            : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
        )}
      >
        <item.icon size={18} strokeWidth={2} />
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col self-start rounded-3xl glass shadow-lg md:ml-4 md:flex">
      <div className="flex h-16 items-center justify-between px-5">
        <span className="text-lg font-bold tracking-tight text-text-primary">Spent.</span>
        <NotificationBell notifications={notifications} />
      </div>

      <div className="px-3">
        <button
          onClick={() => openTransactionSheet()}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-text-on-accent shadow-sm transition-colors hover:bg-accent-hover"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add transaction
        </button>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-3">
        {NAV_ITEMS.map(renderLink)}

        <p className="mb-0.5 mt-5 px-3.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">Finance</p>
        {FINANCE_NAV_ITEMS.map(renderLink)}
      </nav>

      <div className="p-3">
        <Link href="/profile" className="flex items-center gap-2.5 rounded-full px-3.5 py-2 hover:bg-surface-2">
          <UserAvatar avatar={avatar} name={userName} size="sm" />
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-sm font-medium text-text-primary">
              <span className="truncate">{userName}</span>
              {isVerified && <VerifiedBadge />}
            </p>
            <p className="truncate text-xs text-text-muted">{userEmail}</p>
          </div>
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2 px-3.5">
          <ThemeToggle />
          <form action={signOutAction}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="submit"
                  aria-label="Sign out"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
                >
                  <LogOut size={16} strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Sign out</TooltipContent>
            </Tooltip>
          </form>
        </div>
      </div>
    </aside>
  );
}
