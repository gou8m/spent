"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(notify: () => void) {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}

/** A slim notice while the device has no connection, so saved pages are never mistaken for live data. */
export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-text-primary px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-[0.8125rem] font-semibold text-bg"
    >
      <WifiOff size={15} strokeWidth={2.25} />
      You are offline. Showing saved data.
    </div>
  );
}
