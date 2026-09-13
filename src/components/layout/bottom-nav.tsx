"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, MoreHorizontal } from "lucide-react";
import { MOBILE_PRIMARY_ITEMS, MOBILE_MORE_ITEMS, type NavItem } from "@/lib/nav";
import { useTransactionSheet } from "@/stores/ui-store";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const openTransactionSheet = useTransactionSheet((s) => s.open);
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MOBILE_MORE_ITEMS.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
  const [left, right] = [MOBILE_PRIMARY_ITEMS.slice(0, 2), MOBILE_PRIMARY_ITEMS.slice(2, 3)];

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-w-14 flex-col items-center gap-1 rounded-full py-1.5 text-[0.6875rem] font-medium transition-colors",
          active ? "text-accent-text" : "text-text-muted",
        )}
      >
        <item.icon size={21} strokeWidth={active ? 2.25 : 2} />
        {item.label}
      </Link>
    );
  };

  function goTo(href: string) {
    setMoreOpen(false);
    router.push(href);
  }

  return (
    <>
      <nav className="safe-bottom fixed inset-x-0 bottom-3 z-30 flex justify-center px-3 md:hidden">
        <div className="flex w-full max-w-md items-center justify-between rounded-full bg-surface px-3 py-1.5 shadow-lg">
          {left.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          <button
            onClick={() => openTransactionSheet()}
            aria-label="Add transaction"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-text-on-accent shadow-md transition-transform active:scale-95"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>

          {right.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="More"
            className={cn(
              "flex min-w-14 flex-col items-center gap-1 rounded-full py-1.5 text-[0.6875rem] font-medium transition-colors",
              isMoreActive ? "text-accent-text" : "text-text-muted",
            )}
          >
            <MoreHorizontal size={21} strokeWidth={isMoreActive ? 2.25 : 2} />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="More" hideHeader>
        <div className="grid grid-cols-2 gap-2.5 pb-2">
          {MOBILE_MORE_ITEMS.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => goTo(item.href)}
              className="flex items-center gap-3 rounded-full bg-surface-2 px-4 py-3 text-left transition-colors hover:bg-surface-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-text-primary">
                <item.icon size={18} strokeWidth={1.9} />
              </span>
              <span className="truncate text-sm font-medium text-text-primary">{item.label}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
