"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { endOfDay, format, startOfDay } from "date-fns";
import { getHolidaysInRange } from "@/lib/holidays";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};

/** True only once we're past hydration: the server has no idea what timezone (or day) the visitor is in. */
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function timeOfDayGreeting(hour: number) {
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
}

/** The wish for today's festival, if there is one (moon-dependent dates are skipped: they may be a day off). */
function todaysWish(currency: string, now: Date): string | null {
  const today = getHolidaysInRange(currency, startOfDay(now), endOfDay(now)).find((h) => h.wish && !h.approx);
  return today?.wish ?? null;
}

const TYPE_MS = 55;
const ERASE_MS = 26;
const HOLD_MS = 1500;

type Step = { text: string; caret: boolean };

/**
 * "Good morning, Goutham". On a festival day it types the greeting letter by letter, holds, deletes it
 * letter by letter, then types the festival wish ("Happy Sankranthi") and leaves it there. The show
 * plays once per day per browser session; after that, and with reduced motion, the wish is just shown.
 */
export function Greeting({ name, currency, birthday, className }: { name: string; currency: string; /** "MM-dd" of their birthday, if known. */ birthday?: string; className?: string }) {
  const isClient = useIsClient();
  const now = isClient ? new Date() : null;
  const greeting = now ? `${timeOfDayGreeting(now.getHours())}, ${name}` : "Hello";
  const isBirthdayToday = !!now && !!birthday && (format(now, "MM-dd") === birthday || (birthday === "02-29" && format(now, "MM-dd") === "02-28" && new Date(now.getFullYear(), 1, 29).getMonth() !== 1));
  const wish = now ? (isBirthdayToday ? `Happy birthday, ${name}` : todaysWish(currency, now)) : null;
  const dayKey = now ? format(now, "yyyy-MM-dd") : "";

  const [step, setStep] = useState<Step | null>(null);

  useEffect(() => {
    if (!wish) return;
    const storageKey = `greeted:${dayKey}`;
    let seen = false;
    try {
      seen = sessionStorage.getItem(storageKey) === "1";
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Private mode etc.: just play it.
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, fn: () => void) => {
      timers.push(setTimeout(() => !cancelled && fn(), ms));
    };
    const cleanup = () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    if (seen || reduced) {
      later(0, () => setStep({ text: wish, caret: false }));
      return cleanup;
    }

    // Build one timeline: type the greeting, hold, erase it, type the wish.
    let t = 0;
    for (let i = 1; i <= greeting.length; i++) {
      t += TYPE_MS;
      later(t, () => setStep({ text: greeting.slice(0, i), caret: true }));
    }
    t += HOLD_MS;
    for (let i = greeting.length - 1; i >= 0; i--) {
      t += ERASE_MS;
      later(t, () => setStep({ text: greeting.slice(0, i), caret: true }));
    }
    t += 280;
    for (let i = 1; i <= wish.length; i++) {
      t += TYPE_MS + 10;
      later(t, () => setStep({ text: wish.slice(0, i), caret: true }));
    }
    later(t + 1600, () => setStep({ text: wish, caret: false }));
    return cleanup;
  }, [wish, greeting, dayKey]);

  // Before the show starts, and on days without a festival, the greeting itself is shown.
  const visible = wish && step ? step : { text: wish && isClient ? "" : greeting, caret: false };
  const finalText = wish ?? greeting;

  return (
    <h1 className={cn("min-h-[1.25em] text-[2rem] font-extrabold tracking-[-1px] text-text-primary", className)} aria-label={finalText}>
      <span aria-hidden="true">
        {visible.text}
        {visible.caret && <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-accent align-middle" style={{ height: "0.95em" }} />}
      </span>
    </h1>
  );
}
