"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useNavProgress } from "@/stores/ui-store";

/** How far the bar creeps on its own while a navigation is in flight — it
 * never reaches 100% until the route actually commits, so a slow navigation
 * doesn't make it look stalled at the finish line. */
const CREEP_CEILING = 90;
const CREEP_INTERVAL_MS = 180;
const CREEP_STEP_DIVISOR = 8;

export function TopProgressBar() {
  const pathname = usePathname();
  const active = useNavProgress((s) => s.active);
  const key = useNavProgress((s) => s.key);
  const finish = useNavProgress((s) => s.finish);

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Global click-capture: any same-origin <a> click (Link-based nav, from
  // the bottom nav, sidebar, or anywhere else) starts the bar without every
  // call site needing to know about it.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      useNavProgress.getState().start();
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // Route committed -> the navigation that was in flight is done.
  useEffect(() => {
    finish();
  }, [pathname, finish]);

  useEffect(() => {
    if (active) {
      const raf = requestAnimationFrame(() => {
        setVisible(true);
        setProgress(15);
      });
      const id = setInterval(() => {
        setProgress((p) => (p >= CREEP_CEILING ? p : p + Math.max(1, (CREEP_CEILING - p) / CREEP_STEP_DIVISOR)));
      }, CREEP_INTERVAL_MS);
      return () => {
        cancelAnimationFrame(raf);
        clearInterval(id);
      };
    }

    const raf = requestAnimationFrame(() => {
      setProgress((p) => (p > 0 ? 100 : p));
    });
    const hide = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hide);
    };
  }, [active, key]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden" aria-hidden>
      <div
        className="h-full bg-accent transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
