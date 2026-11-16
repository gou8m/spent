"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Bell } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { markNotificationsReadAction } from "@/actions/profile";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/lib/data/notifications";

/** Card tint per notification colour: alerts (rose) read red, goal/info (blue) read sky,
 * everything else sits on the neutral surface, matching reference screen 18. */
const TONES: Record<string, { card: string; title: string; body: string; dot: string }> = {
  rose: { card: "bg-error-subtle", title: "text-error", body: "text-error/80", dot: "bg-error" },
  blue: { card: "bg-sky", title: "text-sky-text", body: "text-sky-text-secondary", dot: "bg-accent" },
  default: { card: "bg-surface-2", title: "text-text-primary", body: "text-text-secondary", dot: "bg-accent" },
};

export function NotificationBell({ notifications }: { notifications: AppNotification[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const [isClearing, setIsClearing] = useState(false);

  const visible = notifications.filter((n) => !clearedIds.has(n.id));
  const unreadCount = visible.filter((n) => !n.read).length;

  async function handleClearAll() {
    setIsClearing(true);
    const ids = notifications.map((n) => n.id);
    await markNotificationsReadAction(ids);
    setClearedIds(new Set(ids));
    setIsClearing(false);
    router.refresh();
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
            open ? "bg-surface-2 text-text-primary" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
          )}
        >
          <Bell size={18} strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-expense ring-2 ring-surface" />
          )}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        {/* Radix's Popover.Portal renders with `asChild`, which Slots its portal
            behavior onto a single child element — so the overlay and the popover
            content have to share one wrapping element here, not be siblings. */}
        <div>
          {/* Radix Popover unmounts this whole Portal's contents the instant `open`
              goes false (no exit animation is registered for any Popover in this
              app), so a plain div here — driven by the same `open` state as the
              popover itself — stays perfectly in sync with it with no extra timing
              logic needed.

              Starts below the mobile header (top-14) rather than the very top of the
              viewport, so the header — bell included — never gets painted over by the
              blur. Without that gap, the bell dimmed into the same fog as everything
              else, and the arrow pointing up at it read as pointing at nothing. Desktop
              keeps the full-viewport overlay (md:top-0) since the sidebar's bell isn't
              part of a fixed top strip the same way. */}
          {open && (
            <div
              className="fixed inset-x-0 bottom-0 top-14 z-40 bg-overlay backdrop-blur-sm md:top-0"
              onClick={() => setOpen(false)}
              aria-hidden
            />
          )}
          <PopoverPrimitive.Content
            side="bottom"
            align="end"
            sideOffset={12}
            alignOffset={-32}
            collisionPadding={16}
            className="z-50 flex max-h-[75vh] w-[85vw] max-w-md flex-col overflow-hidden rounded-[28px] bg-bg shadow-lg outline-none"
          >
            <div className="flex shrink-0 items-center gap-3 px-5 pb-2 pt-4">
              <p className="flex-1 text-lg font-extrabold tracking-tight text-text-primary">Notifications</p>
              {visible.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={isClearing}
                  className="h-10 rounded-full bg-accent-subtle px-3.5 text-[0.8125rem] font-bold text-accent-hover transition-colors hover:bg-surface-3 disabled:opacity-60"
                >
                  {isClearing ? "Marking…" : "Mark all read"}
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
              {visible.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-text-secondary">You&apos;re all caught up.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {visible.map((n) => {
                    const tone = TONES[n.color] ?? TONES.default;
                    return (
                      <li key={n.id}>
                        <Link
                          href={n.href}
                          onClick={() => setOpen(false)}
                          className={cn("flex items-start gap-3 rounded-[22px] p-3.5 transition-opacity hover:opacity-90", tone.card)}
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface">
                            <IconChip icon={n.icon} color={n.color} size="sm" flat />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className={cn("block text-[0.9375rem] font-bold", tone.title)}>{n.title}</span>
                              {!n.read && <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", tone.dot)} />}
                            </span>
                            <span className={cn("mt-0.5 block text-[0.8125rem] leading-snug", tone.body)}>{n.description}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <PopoverPrimitive.Arrow className="fill-bg drop-shadow-sm" width={16} height={8} />
          </PopoverPrimitive.Content>
        </div>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
