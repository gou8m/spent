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

/** One tab of the bar. The sliding bubble behind the current tab is drawn by the bar itself, so a tab
 * only has to change its own colour. */
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative z-10 flex h-full flex-1 flex-col items-center justify-center gap-0.5 rounded-full transition-colors duration-300",
        active ? "text-text-on-accent" : "text-text-secondary active:text-text-primary",
      )}
    >
      <item.icon size={21} strokeWidth={active ? 2.4 : 2} />
      <span className={cn("text-[0.6875rem] leading-none", active ? "font-bold" : "font-semibold")}>{item.label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const isPrimary = TAB_BAR_HREFS.has(pathname);
  const offset = useScrollOffset(isPrimary, pathname);

  if (!isPrimary) return null;

  const activeIndex = NAV_ITEMS.findIndex((item) => pathname === item.href || pathname.startsWith(item.href + "/"));

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-4 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex h-16 max-w-md items-stretch rounded-full border border-divider bg-surface/95 p-1 shadow-[0_10px_28px_rgba(15,40,20,0.16)] backdrop-blur-md will-change-transform md:hidden"
      style={{
        transform: `translateY(${offset}px)`,
        opacity: 1 - offset / MAX_OFFSET_PX,
        pointerEvents: offset === 0 ? "auto" : "none",
      }}
    >
      {/* The bubble: one pill that glides from tab to tab. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-full bg-accent shadow-[0_6px_16px_rgba(27,107,51,0.3)] transition-[transform,opacity] duration-[380ms] ease-[cubic-bezier(0.34,1.4,0.5,1)]"
        style={{
          width: `calc((100% - 0.5rem) / ${NAV_ITEMS.length})`,
          transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
          opacity: activeIndex === -1 ? 0 : 1,
        }}
      />
      {NAV_ITEMS.map((item, i) => (
        <NavLink key={item.href} item={item} active={i === activeIndex} />
      ))}
    </nav>
  );
}
