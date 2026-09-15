"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { IconChip } from "@/components/ui/icon-chip";
import { markNotificationsReadAction } from "@/actions/profile";
import type { AppNotification } from "@/lib/data/notifications";

export function NotificationBell({ notifications }: { notifications: AppNotification[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.read && !locallyRead.has(n.id)).length;

  async function handleMarkAllRead() {
    setLocallyRead(new Set(notifications.map((n) => n.id)));
    await markNotificationsReadAction(notifications.map((n) => n.id));
    router.refresh();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="end">
        <div className="flex items-center justify-between px-2.5 py-1.5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">Notifications</p>
          {unreadCount > 0 && (
            <button type="button" onClick={handleMarkAllRead} className="text-xs font-medium text-accent-text hover:underline">
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-sm text-text-secondary">You&apos;re all caught up.</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto overscroll-contain">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2.5 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-surface-2"
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
      </PopoverContent>
    </Popover>
  );
}
