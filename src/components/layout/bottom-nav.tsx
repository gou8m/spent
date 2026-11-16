"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NAV_ITEMS, type NavItem } from "@/lib/nav";
import { TAB_BAR_HREFS } from "@/lib/nav-chrome";
import { cn } from "@/lib/utils";

/** How far the nav travels between fully shown and fully hidden — enough to
 * clear the bar entirely below the viewport. */
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
    lastY.current = window.scrollY;
    document.documentElement.style.setProperty("--nav-offset", "0px");
    const raf = requestAnimationFrame(() => setOffset(0));
    return () => cancelAnimationFrame(raf);
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
        // The floating Add button reads this to travel down with the bar, pixel for pixel.
        document.documentElement.style.setProperty("--nav-offset", `${next}px`);
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
      aria-current={active ? "page" : undefined}
      className="flex min-w-11 flex-col items-center gap-1 text-xs"
    >
      <span
        className={cn(
          "flex h-9 w-17 items-center justify-center rounded-full transition-colors",
          active ? "bg-accent-subtle text-accent-text" : "text-text-secondary",
        )}
      >
        <item.icon size={22} strokeWidth={2} />
      </span>
      <span className={cn(active ? "font-bold text-accent-text" : "font-semibold text-text-secondary")}>{item.label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const isPrimary = TAB_BAR_HREFS.has(pathname);
  const offset = useScrollOffset(isPrimary, pathname);

  if (!isPrimary) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-21 items-center justify-around border-t border-divider bg-surface px-3 pb-2.5 will-change-transform md:hidden"
      style={{
        transform: `translateY(${offset}px)`,
        opacity: 1 - offset / MAX_OFFSET_PX,
        pointerEvents: offset === 0 ? "auto" : "none",
      }}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} />
      ))}
    </nav>
  );
}
