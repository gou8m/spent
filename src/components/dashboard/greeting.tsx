"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** True only once we're past hydration — same pattern as ThemeToggle's
 * useIsClient, needed because the server and first client render must
 * agree, and the server has no idea what timezone the visitor is in. */
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function Greeting({ name }: { name: string }) {
  const isClient = useIsClient();
  const hour = new Date().getHours();
  const greeting = !isClient ? "Hello" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
      {greeting}, {name}
    </h1>
  );
}
