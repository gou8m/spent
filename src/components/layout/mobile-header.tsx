import Link from "next/link";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileMenu } from "@/components/layout/mobile-menu";
import type { AppNotification } from "@/lib/data/notifications";

export function MobileHeader({ notifications }: { notifications: AppNotification[] }) {
  return (
    <header className="safe-top sticky top-0 z-20 flex h-14 items-center justify-between border-b border-divider bg-surface px-4 md:hidden">
      <Link href="/dashboard">
        <span className="text-lg font-bold tracking-tight text-text-primary">Spent.</span>
      </Link>
      <div className="flex items-center gap-1.5">
        <NotificationBell notifications={notifications} />
        <MobileMenu />
      </div>
    </header>
  );
}
