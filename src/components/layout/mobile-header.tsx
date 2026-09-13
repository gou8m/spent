import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";

export function MobileHeader({ avatar, name }: { avatar: string; name: string }) {
  return (
    <header className="safe-top sticky top-0 z-20 flex h-14 items-center justify-between border-b border-divider bg-surface px-4 md:hidden">
      <Link href="/dashboard">
        <span className="text-lg font-bold tracking-tight text-text-primary">Spent.</span>
      </Link>
      <Link href="/profile" aria-label="Profile">
        <UserAvatar avatar={avatar} name={name} size="sm" />
      </Link>
    </header>
  );
}
