"use client";

import { useEffect } from "react";

/** Registers the service worker (production only: in development it would cache stale builds). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Not installable or blocked (private mode, old browser): the site simply works as before.
    });
  }, []);
  return null;
}
