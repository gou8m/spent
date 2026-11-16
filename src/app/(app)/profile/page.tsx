import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Coins, SunMoon, Bell, Shield, Info, ChevronRight, LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { signOutAction } from "@/actions/session";
import { ThemeValue } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { HomeMenu } from "@/components/layout/home-menu";
import { isUserVerified } from "@/lib/verified";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);
  const isVerified = await isUserVerified(user.id, user.email);

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[2rem] font-extrabold tracking-tight text-accent-text md:tracking-[-1px] md:text-text-primary">Settings</h1>
        <div className="md:hidden">
          <HomeMenu />
        </div>
      </div>

      <Link href="/profile/edit" className="flex items-center gap-3.5 rounded-xl bg-sky px-4 py-3 transition-opacity hover:opacity-90">
        <UserAvatar avatar={user.avatar} name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-lg font-bold text-sky-text">
            <span className="truncate">{user.name}</span>
            {isVerified && <VerifiedBadge />}
          </p>
          <p className="truncate text-[0.8125rem] font-medium text-sky-text-secondary">{user.email}</p>
        </div>
        <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-sky-text" />
      </Link>

      <div>
        <h2 className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Preferences</h2>
        <Card className="divide-y divide-divider p-0">
          <Link href="/profile/preferences" className="flex h-11.5 items-center gap-3.5 px-4 hover:bg-surface-3">
            <Coins size={20} strokeWidth={2} className="shrink-0 text-accent-text" />
            <span className="flex-1 text-[0.9375rem] font-semibold text-text-primary">Currency</span>
            <span className="text-sm font-semibold text-text-secondary">{user.currency}</span>
            <ChevronRight size={17} strokeWidth={2} className="shrink-0 text-text-secondary" />
          </Link>
          <Link href="/profile/preferences" className="flex h-11.5 items-center gap-3.5 px-4 hover:bg-surface-3">
            <SunMoon size={20} strokeWidth={2} className="shrink-0 text-accent-text" />
            <span className="flex-1 text-[0.9375rem] font-semibold text-text-primary">Theme</span>
            <ThemeValue />
            <ChevronRight size={17} strokeWidth={2} className="shrink-0 text-text-secondary" />
          </Link>
          <Link href="/profile/notifications" className="flex h-11.5 items-center gap-3.5 px-4 hover:bg-surface-3">
            <Bell size={20} strokeWidth={2} className="shrink-0 text-accent-text" />
            <span className="flex-1 text-[0.9375rem] font-semibold text-text-primary">Notifications</span>
            <ChevronRight size={17} strokeWidth={2} className="shrink-0 text-text-secondary" />
          </Link>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Data</h2>
        <Card className="divide-y divide-divider p-0">
          <Link href="/import-export" className="flex h-11.5 items-center gap-3.5 px-4 hover:bg-surface-3">
            <Shield size={20} strokeWidth={2} className="shrink-0 text-accent-text" />
            <span className="flex-1 text-[0.9375rem] font-semibold text-text-primary">Backup &amp; restore</span>
            <ChevronRight size={17} strokeWidth={2} className="shrink-0 text-text-secondary" />
          </Link>
          <Link href="/profile/about" className="flex h-11.5 items-center gap-3.5 px-4 hover:bg-surface-3">
            <Info size={20} strokeWidth={2} className="shrink-0 text-accent-text" />
            <span className="flex-1 text-[0.9375rem] font-semibold text-text-primary">About</span>
            <ChevronRight size={17} strokeWidth={2} className="shrink-0 text-text-secondary" />
          </Link>
        </Card>
        {user.lastBackupAt && (
          <p className="mt-1.5 px-1 text-xs text-text-muted">Last backup: {formatDistanceToNow(user.lastBackupAt, { addSuffix: true })}</p>
        )}
      </div>

      <form action={signOutAction} className="flex justify-end">
        <button
          type="submit"
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-error-subtle px-6 text-[0.9375rem] font-bold text-error transition-opacity hover:opacity-90"
        >
          <LogOut size={17} strokeWidth={2} />
          Sign out
        </button>
      </form>
    </div>
  );
}
