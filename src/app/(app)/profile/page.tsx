import Link from "next/link";
import type { ReactNode } from "react";
import { format } from "date-fns";
import { Coins, Bell, Shield, Info, ChevronRight, LogOut, Tags, KeyRound, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { signOutAction } from "@/actions/session";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { HomeMenu } from "@/components/layout/home-menu";
import { StatementRow } from "@/components/profile/statement-row";
import { GuideRow } from "@/components/guide/app-guide";
import { isUserVerified } from "@/lib/verified";

const heading = "mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary";

function Tile({ href, icon, label, value }: { href: string; icon: ReactNode; label: string; value: string }) {
  return (
    <Link href={href} className="flex min-h-[5.5rem] flex-col justify-between rounded-lg bg-surface-2 p-4 transition-colors hover:bg-surface-3 active:scale-[0.99]">
      <span className="flex items-center justify-between text-accent-text">
        {icon}
        <ChevronRight size={16} strokeWidth={2} className="text-text-secondary" />
      </span>
      <span>
        <span className="block text-[0.9375rem] font-bold text-text-primary">{label}</span>
        <span className="block truncate text-xs font-semibold text-text-secondary">{value}</span>
      </span>
    </Link>
  );
}

function Row({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="flex h-11.5 items-center gap-3.5 px-4 hover:bg-surface-3">
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
  const alerts = [user.notifyBills, user.notifyBudgets, user.notifyGoals, user.notifySubscriptions, user.notifyHolidays, user.notifyLoans];

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[2rem] font-extrabold tracking-tight text-accent-text md:tracking-[-1px] md:text-text-primary">Settings</h1>
        <div className="md:hidden">
          <HomeMenu />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-accent text-text-on-accent">
        <Link href="/profile/edit" aria-label="Edit profile" className="flex items-center gap-4 p-5 transition-opacity hover:opacity-95">
          <UserAvatar avatar={user.avatar} name={user.name} size="lg" className="h-16! w-16! rounded-[20px]! ring-2 ring-white/30" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-xl font-extrabold">
              <span className="truncate">{user.name}</span>
              {isVerified && <VerifiedBadge />}
            </span>
            <span className="block truncate text-sm opacity-85">{user.email}</span>
          </span>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 dark:bg-black/10">
            <Pencil size={17} strokeWidth={2.25} />
          </span>
        </Link>
        <p className="border-t border-white/20 px-5 py-2.5 text-xs font-semibold opacity-85 dark:border-black/10">Member since {format(user.createdAt, "MMM yyyy")}</p>
      </div>

      <section>
        <h2 className={heading}>Quick settings</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <Tile href="/profile/preferences" icon={<Coins size={22} strokeWidth={2} />} label="Currency" value={user.currency} />
          <Tile href="/profile/notifications" icon={<Bell size={22} strokeWidth={2} />} label="Notifications" value={`${alerts.filter(Boolean).length} of ${alerts.length} on`} />
          <Tile href="/profile/categories" icon={<Tags size={22} strokeWidth={2} />} label="Categories" value="Names, icons, colors" />
          <Tile href="/profile/edit" icon={<KeyRound size={22} strokeWidth={2} />} label="Security" value="Password and email" />
        </div>
      </section>

      <section>
        <h2 className={heading}>Data and help</h2>
        <Card className="divide-y divide-divider p-0">
          <Row href="/import-export" icon={<Shield size={20} strokeWidth={2} />} label="Backup & restore" />
          <StatementRow />
          <GuideRow />
          <Row href="/profile/about" icon={<Info size={20} strokeWidth={2} />} label="About" />
        </Card>
      </section>

      <form action={signOutAction}>
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-error-subtle text-[0.9375rem] font-bold text-error transition-opacity hover:opacity-90"
        >
          <LogOut size={17} strokeWidth={2} />
          Sign out
        </button>
      </form>
    </div>
  );
}
