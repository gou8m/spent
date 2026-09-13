import Link from "next/link";
import { ChevronRight, Tags, LogOut, Wallet, Repeat, Target, BarChart3, ArrowDownUp, Coins } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { signOutAction } from "@/actions/session";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { CurrencySelector } from "@/components/profile/currency-selector";
import { CurrencyInfo } from "@/components/profile/currency-info";
import { EmailSection } from "@/components/profile/email-section";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { LegalNotice } from "@/components/legal-notice";
import { MAX_CURRENCY_CHANGES } from "@/lib/constants";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);
  const changesRemaining = Math.max(0, MAX_CURRENCY_CHANGES - user.currencyChangeCount);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Profile</h1>

      <Card className="p-5">
        <ProfileForm name={user.name} avatar={user.avatar} email={user.email} />
      </Card>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Finance</h2>
        <Card className="divide-y divide-divider p-0">
          <Link href="/profile/categories" className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
            <Tags size={17} className="text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text-primary">Categories</span>
            <ChevronRight size={16} className="text-text-muted" />
          </Link>
          <Link href="/accounts" className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
            <Wallet size={17} className="text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text-primary">Accounts</span>
            <ChevronRight size={16} className="text-text-muted" />
          </Link>
          <Link href="/recurring" className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
            <Repeat size={17} className="text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text-primary">Recurring & subscriptions</span>
            <ChevronRight size={16} className="text-text-muted" />
          </Link>
          <Link href="/goals" className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
            <Target size={17} className="text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text-primary">Goals</span>
            <ChevronRight size={16} className="text-text-muted" />
          </Link>
          <Link href="/reports" className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
            <BarChart3 size={17} className="text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text-primary">Reports</span>
            <ChevronRight size={16} className="text-text-muted" />
          </Link>
          <Link href="/import-export" className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
            <ArrowDownUp size={17} className="text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text-primary">Import & export</span>
            <ChevronRight size={16} className="text-text-muted" />
          </Link>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Coins size={17} className="text-text-muted" />
            <div className="flex flex-1 items-center gap-1.5">
              <span className="text-sm font-medium text-text-primary">Currency</span>
              <CurrencyInfo currency={user.currency} remaining={changesRemaining} />
            </div>
            <CurrencySelector currency={user.currency} changesUsed={user.currencyChangeCount} />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Account & security</h2>
        <Card className="divide-y divide-divider p-0">
          <EmailSection email={user.email} pendingEmail={user.pendingEmail} />
          <ChangePasswordDialog />
        </Card>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Appearance</h2>
        <Card className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm font-medium text-text-primary">Theme</span>
          <ThemeToggle />
        </Card>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Account</h2>
        <Card className="p-0">
          <form action={signOutAction}>
            <button type="submit" className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2">
              <LogOut size={17} className="text-error" />
              <span className="text-sm font-medium text-error">Sign out</span>
            </button>
          </form>
        </Card>
      </div>

      <LegalNotice />
    </div>
  );
}
