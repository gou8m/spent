"use client";

import { useEffect, useState } from "react";
import { getAccountActivityAction } from "@/actions/accounts";

type Activity = Awaited<ReturnType<typeof getAccountActivityAction>>;

/** Last result per account. Opening an account shows this straight away while a fresh copy loads
 * (stale-while-revalidate), and the Accounts page fills it in ahead of time so a tap is instant. */
const cache = new Map<string, NonNullable<Activity>>();
const inflight = new Map<string, Promise<Activity>>();

function load(accountId: string): Promise<Activity> {
  const running = inflight.get(accountId);
  if (running) return running;
  const promise = getAccountActivityAction(accountId)
    .then((result) => {
      if (result) cache.set(accountId, result);
      return result;
    })
    .finally(() => inflight.delete(accountId));
  inflight.set(accountId, promise);
  return promise;
}

export function prefetchAccountActivity(accountId: string) {
  void load(accountId).catch(() => {});
}

/** The account's recent activity: cached copy first (if any), then the fresh one. `null` only while
 * nothing is known yet. */
export function useAccountActivity(accountId: string): Activity | null {
  const [activity, setActivity] = useState<Activity | null>(() => cache.get(accountId) ?? null);
  const [forId, setForId] = useState(accountId);
  if (forId !== accountId) {
    setForId(accountId);
    setActivity(cache.get(accountId) ?? null);
  }

  useEffect(() => {
    let cancelled = false;
    load(accountId)
      .then((result) => !cancelled && setActivity(result))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  return activity;
}
