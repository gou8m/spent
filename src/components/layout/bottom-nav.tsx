"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { NAV_ITEMS, PROFILE_NAV_ITEM, type NavItem } from "@/lib/nav";
import { useTransactionSheet } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

/** Tab pages — the only ones the bottom nav ever hides/reveals on scroll for.
 * Every other in-app route (Budgets, Goals, Categories, About, etc.) is a
 * "back" destination reached by drilling into a tab, so the nav stays hidden
 * there entirely instead of animating. */
const PRIMARY_HREFS = new Set([...NAV_ITEMS.map((item) => item.href), PROFILE_NAV_ITEM.href]);

/** How far the nav travels between fully shown and fully hidden — enough to
 * clear the pill entirely below the viewport. */
const MAX_OFFSET_PX = 96;

/** Scroll distance from the very top that's always fully shown, regardless of
 * direction — just enough to ignore iOS's elastic overscroll bounce at rest. */
const TOP_GUARD_PX = 4;

/** Tracks scroll position and returns a 0..MAX_OFFSET_PX value that moves
 * pixel-for-pixel with scroll: scroll down N px and the nav travels N px
 * toward hidden, scroll up N px and it travels N px back — no easing curve
 * of its own, so it stays in lockstep with the finger/wheel instead of
 * lagging behind a fixed-duration animation. */
function useScrollOffset(enabled: boolean, pathname: string) {
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const lastY = useRef(0);

  useEffect(() => {
    offsetRef.current = 0;
    setOffset(0);
    lastY.current = window.scrollY;
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        lastY.current = y;

        const next = y <= TOP_GUARD_PX ? 0 : Math.min(MAX_OFFSET_PX, Math.max(0, offsetRef.current + delta));
        offsetRef.current = next;
        setOffset(next);
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);

  return offset;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors",
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
  const isPrimary = PRIMARY_HREFS.has(pathname);
  const offset = useScrollOffset(isPrimary, pathname);

  const [left, right] = [NAV_ITEMS.slice(0, 2), NAV_ITEMS.slice(2, 3)];

  if (!isPrimary) return null;

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-3 z-30 flex justify-center px-3 will-change-transform md:hidden"
      style={{
        transform: `translateY(${offset}px)`,
        opacity: 1 - offset / MAX_OFFSET_PX,
        pointerEvents: offset === 0 ? "auto" : "none",
      }}
    >
      <div className="flex items-center justify-center gap-2 rounded-full bg-surface px-6 py-1.5 shadow-lg">
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
