import Link from "next/link";
import { Wallet, Settings } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="safe-top sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-text-on-accent">
          <Wallet size={14} strokeWidth={2.25} />
        </span>
        <span className="text-[0.9375rem] font-bold tracking-tight text-text-primary">Spent</span>
      </Link>
      <Link
        href="/settings"
        aria-label="Settings"
        className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-surface-2"
      >
        <Settings size={18} strokeWidth={2} />
      </Link>
    </header>
  );
}
