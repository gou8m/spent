import Link from "next/link";
import { Wallet } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";

export function MobileHeader({ avatar }: { avatar: string }) {
  return (
    <header className="safe-top sticky top-3 z-20 mx-3 flex h-14 items-center justify-between rounded-full glass px-4 shadow-md md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-2xl bg-accent text-text-on-accent">
          <Wallet size={14} strokeWidth={2.25} />
        </span>
        <span className="text-[0.9375rem] font-bold tracking-tight text-text-primary">Spent</span>
      </Link>
      <Link href="/profile" aria-label="Profile">
        <UserAvatar avatar={avatar} size="sm" />
      </Link>
    </header>
  );
}
