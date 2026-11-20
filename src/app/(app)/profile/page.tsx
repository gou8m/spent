import Link from "next/link";
import type { ReactNode } from "react";
import { format } from "date-fns";
import { ChevronRight, Info, LogOut, Mail, Shield, SlidersHorizontal, Smartphone, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { signOutAction } from "@/actions/session";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { HomeMenu } from "@/components/layout/home-menu";
import { StatementRow } from "@/components/profile/statement-row";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { ShareAppRow } from "@/components/profile/app-share-rows";
import { ANDROID_RELEASE } from "@/lib/app-release";
import { GuideRow } from "@/components/guide/app-guide";
import { APP_VERSION } from "@/lib/constants";
import { isUserVerified } from "@/lib/verified";

const heading = "mb-2 mt-6 text-[0.875rem] font-bold uppercase tracking-wide text-text-secondary";

function Row({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="flex h-13 items-center gap-3.5 px-4 hover:bg-surface-3">
      <span className="shrink-0 text-accent-text">{icon}</span>
      <span className="flex-1 text-base font-semibold text-text-primary">{label}</span>
      <ChevronRight size={19} strokeWidth={2} className="shrink-0 text-text-secondary" />
    </Link>
  );
}

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);
  const isVerified = await isUserVerified(user.id, user.email);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-[2.25rem] font-extrabold tracking-tight text-accent-text md:tracking-[-1px] md:text-text-primary">Settings</h1>
        <div className="md:hidden">
          <HomeMenu />
        </div>
      </div>

      <Card className="mt-4">
        <div className="flex items-center gap-4 p-4.5">
          <UserAvatar avatar={user.avatar} name={user.name} size="lg" className="h-16! w-16! rounded-[22px]! text-2xl" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xl font-extrabold text-text-primary">
              <span className="truncate">{user.name}</span>
              {isVerified && <VerifiedBadge />}
            </p>
            <p className="truncate text-[0.9375rem] text-text-secondary">{user.email}</p>
          </div>
        </div>
        <p className="flex items-center gap-2.5 bg-accent-subtle px-4.5 py-2.5 text-[0.8125rem] font-bold text-accent-text">
          <span className="h-[7px] w-[7px] rounded-full bg-accent" />
          Member since {format(user.createdAt, "MMM yyyy")}
        </p>
      </Card>

      <h2 className={heading}>Account</h2>
      <Card className="divide-y divide-divider p-0">
        <Row href="/profile/edit" icon={<UserRound size={22} strokeWidth={2} />} label="Profile" />
        <Row href="/profile/preferences" icon={<SlidersHorizontal size={22} strokeWidth={2} />} label="Preferences" />
        <Row href="/profile/contact" icon={<Mail size={22} strokeWidth={2} />} label="Email and phone" />
        <ChangePasswordDialog settingsRow />
      </Card>

      <h2 className={heading}>Data</h2>
      <Card className="divide-y divide-divider p-0">
        <Row href="/import-export" icon={<Shield size={22} strokeWidth={2} />} label="Backup and restore" />
        <StatementRow />
      </Card>

      <h2 className={heading}>Help</h2>
      <Card className="divide-y divide-divider p-0">
        <GuideRow />
        <ShareAppRow />
        <Row href={ANDROID_RELEASE.apkUrl} icon={<Smartphone size={22} strokeWidth={2} />} label="Download Android app" />
        <Row href="/profile/about" icon={<Info size={22} strokeWidth={2} />} label="About" />
      </Card>

      <form action={signOutAction} className="mt-7">
        <button
          type="submit"
          className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-error-subtle text-base font-bold text-error transition-opacity hover:opacity-90"
        >
          <LogOut size={17} strokeWidth={2} />
          Sign out
        </button>
      </form>

      <p className="mt-4 text-center text-sm font-semibold text-text-muted">Spent. · Version {APP_VERSION}</p>
    </div>
  );
}
