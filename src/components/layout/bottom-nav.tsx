"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NAV_ITEMS, type NavItem } from "@/lib/nav";
import { TAB_BAR_HREFS } from "@/lib/nav-chrome";
import { cn } from "@/lib/utils";

/** How far the nav travels between fully shown and fully hidden — enough to
 * clear the bar entirely below the viewport. */
const MAX_OFFSET_PX = 128;

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

/** One tab of the floating bar: icon only, except the current tab, which swells into a labelled
 * bubble. The label stays available to screen readers on every tab. */
function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-full transition-all duration-200",
        active ? "bg-accent px-4.5 text-text-on-accent shadow-[0_6px_16px_rgba(27,107,51,0.3)]" : "w-12 text-text-secondary active:bg-surface-2",
      )}
    >
      <item.icon size={22} strokeWidth={active ? 2.25 : 2} />
      {active && <span className="text-[0.8125rem] font-bold">{item.label}</span>}
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
      aria-label="Main"
      className="fixed inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex h-16 max-w-md items-center justify-between rounded-full border border-divider bg-surface/95 px-2.5 shadow-[0_12px_32px_rgba(15,40,20,0.18)] backdrop-blur-md will-change-transform md:hidden"
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
