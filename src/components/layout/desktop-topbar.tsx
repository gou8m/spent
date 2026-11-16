import Link from "next/link";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { AppNotification } from "@/lib/data/notifications";

/** Bell + avatar tiles pinned to the top-right of the content area from md up
 * (reference desktop screens 58-61). On mobile Home renders its own header row. */
export function DesktopTopbar({
  notifications,
  avatar,
  name,
}: {
  notifications: AppNotification[];
  avatar: string;
  name: string;
}) {
  return (
    <div className="absolute right-6 top-8.5 z-20 hidden items-center gap-3 md:flex lg:right-10">
      <NotificationBell notifications={notifications} />
      <Link href="/profile" aria-label="Profile">
        <UserAvatar avatar={avatar} name={name} className="h-11 w-11 rounded-sm" />
      </Link>
    </div>
  );
}
