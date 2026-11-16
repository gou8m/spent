"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Registers the service worker (production only: in development it would cache stale builds),
 * and tells it to forget saved pages whenever the login screen is shown, which is where a
 * sign-out lands. Signed-in people are never shown /login, so this only ever fires after leaving. */
export function PwaRegister() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Not installable or blocked (private mode, old browser): the site simply works as before.
    });
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
      navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ type: "purge-pages" })).catch(() => {});
    }
  }, [pathname]);

  return null;
}
