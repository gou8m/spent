import Link from "next/link";
import type { ReactNode } from "react";
import { format } from "date-fns";
import { ChevronRight, Info, LogOut, Mail, Shield, SlidersHorizontal, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { signOutAction } from "@/actions/session";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { HomeMenu } from "@/components/layout/home-menu";
import { StatementRow } from "@/components/profile/statement-row";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { GuideRow } from "@/components/guide/app-guide";
import { APP_VERSION } from "@/lib/constants";
import { isUserVerified } from "@/lib/verified";

const heading = "mb-1.5 mt-3.5 text-[0.75rem] font-bold uppercase tracking-wide text-text-secondary";

function Row({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="flex h-10.5 items-center gap-3.5 px-4 hover:bg-surface-3">
      <span className="shrink-0 text-accent-text">{icon}</span>
      <span className="flex-1 text-[0.9375rem] font-semibold text-text-primary">{label}</span>
      <ChevronRight size={17} strokeWidth={2} className="shrink-0 text-text-secondary" />
    </Link>
  );
}

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);
  const isVerified = await isUserVerified(user.id, user.email);

  return (
    // The shell leaves generous room under the page for the bottom bar; Settings is short enough to fit one
    // screen, so a little of that room is taken back and the page does not need to scroll.
    <div className="-mb-9 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-[2rem] font-extrabold tracking-tight text-accent-text md:tracking-[-1px] md:text-text-primary">Settings</h1>
        <div className="md:hidden">
          <HomeMenu />
        </div>
      </div>

      <Card className="mt-3">
        <div className="flex items-center gap-3.5 p-3.5">
          <UserAvatar avatar={user.avatar} name={user.name} size="lg" className="h-13! w-13! rounded-[18px]! text-xl" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-lg font-extrabold text-text-primary">
              <span className="truncate">{user.name}</span>
              {isVerified && <VerifiedBadge />}
            </p>
            <p className="truncate text-sm text-text-secondary">{user.email}</p>
          </div>
        </div>
        <p className="flex items-center gap-2.5 bg-accent-subtle px-4 py-2 text-xs font-bold text-accent-text">
          <span className="h-[7px] w-[7px] rounded-full bg-accent" />
          Member since {format(user.createdAt, "MMM yyyy")}
        </p>
      </Card>

      <h2 className={heading}>Account</h2>
      <Card className="divide-y divide-divider p-0">
        <Row href="/profile/edit" icon={<UserRound size={20} strokeWidth={2} />} label="Profile" />
        <Row href="/profile/preferences" icon={<SlidersHorizontal size={20} strokeWidth={2} />} label="Preferences" />
        <Row href="/profile/contact" icon={<Mail size={20} strokeWidth={2} />} label="Email and phone" />
        <ChangePasswordDialog settingsRow />
      </Card>

      <h2 className={heading}>Data</h2>
      <Card className="divide-y divide-divider p-0">
        <Row href="/import-export" icon={<Shield size={20} strokeWidth={2} />} label="Backup and restore" />
        <StatementRow />
      </Card>

      <h2 className={heading}>Help</h2>
      <Card className="divide-y divide-divider p-0">
        <GuideRow />
        <Row href="/profile/about" icon={<Info size={20} strokeWidth={2} />} label="About" />
      </Card>

      <form action={signOutAction} className="mt-4">
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-error-subtle text-[0.9375rem] font-bold text-error transition-opacity hover:opacity-90"
        >
          <LogOut size={17} strokeWidth={2} />
          Sign out
        </button>
      </form>

      <p className="mt-3 text-center text-xs font-semibold text-text-muted">Spent. · Version {APP_VERSION}</p>
    </div>
  );
}
