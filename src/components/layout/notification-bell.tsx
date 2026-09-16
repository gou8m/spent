"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Bell } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Button } from "@/components/ui/button";
import { markNotificationsReadAction } from "@/actions/profile";
import type { AppNotification } from "@/lib/data/notifications";

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
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
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
              logic needed. */}
          {open && (
            <div
              className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden
            />
          )}
          <PopoverPrimitive.Content
            side="bottom"
            align="end"
            sideOffset={12}
            collisionPadding={16}
            className="z-50 flex max-h-[75vh] w-[75vw] max-w-md flex-col overflow-hidden rounded-3xl bg-surface shadow-lg outline-none"
          >
            <div className="flex shrink-0 items-center px-5 py-4">
              <p className="text-sm font-semibold text-text-primary">Notifications</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2">
              {visible.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-text-secondary">You&apos;re all caught up.</p>
              ) : (
                <ul>
                  {visible.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-surface-2"
                      >
                        <IconChip icon={n.icon} color={n.color} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-text-primary">{n.title}</span>
                          <span className="block truncate text-xs text-text-muted">{n.description}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {visible.length > 0 && (
              <div className="shrink-0 border-t border-divider bg-surface-2/60 px-5 py-4">
                <Button type="button" variant="outline" className="w-full" onClick={handleClearAll} loading={isClearing} loadingText="Clearing…">
                  Clear All
                </Button>
              </div>
            )}

            <PopoverPrimitive.Arrow className="fill-surface drop-shadow-sm" width={16} height={8} />
          </PopoverPrimitive.Content>
        </div>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
