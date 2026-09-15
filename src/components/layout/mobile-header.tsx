import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";
import { NotificationBell } from "@/components/layout/notification-bell";
import type { AppNotification } from "@/lib/data/notifications";

export function MobileHeader({ avatar, name, notifications }: { avatar: string; name: string; notifications: AppNotification[] }) {
  return (
    <header className="safe-top sticky top-0 z-20 flex h-14 items-center justify-between border-b border-divider bg-surface px-4 md:hidden">
      <Link href="/dashboard">
        <span className="text-lg font-bold tracking-tight text-text-primary">Spent.</span>
      </Link>
      <div className="flex items-center gap-1.5">
        <NotificationBell notifications={notifications} />
        <Link href="/profile" aria-label="Profile">
          <UserAvatar avatar={avatar} name={name} size="sm" />
        </Link>
      </div>
    </header>
  );
}
