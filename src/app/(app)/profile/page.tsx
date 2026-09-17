import Link from "next/link";
import { LogOut, Coins, SunMoon, Info, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { signOutAction } from "@/actions/session";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { CurrencySelector } from "@/components/profile/currency-selector";
import { EmailSection } from "@/components/profile/email-section";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { NotificationPrefs } from "@/components/profile/notification-prefs";
import { ProfileLegalLinks } from "@/components/profile/profile-legal-links";
import { isUserVerified } from "@/lib/verified";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);
  const isVerified = await isUserVerified(user.id, user.email);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Profile</h1>

      <Card className="p-5">
        <ProfileForm name={user.name} avatar={user.avatar} email={user.email} isVerified={isVerified} />
      </Card>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Account & security</h2>
        <Card className="divide-y divide-divider p-0">
          <EmailSection email={user.email} pendingEmail={user.pendingEmail} />
          <ChangePasswordDialog />
        </Card>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Notifications</h2>
        <Card className="divide-y divide-divider p-0">
          <NotificationPrefs
            notifyBills={user.notifyBills}
            notifyBudgets={user.notifyBudgets}
            notifyGoals={user.notifyGoals}
            notifySubscriptions={user.notifySubscriptions}
            notifyHolidays={user.notifyHolidays}
            notifyLoans={user.notifyLoans}
          />
        </Card>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Preferences</h2>
        <Card className="divide-y divide-divider p-0">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <SunMoon size={17} className="text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text-primary">Theme</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Coins size={17} className="text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text-primary">Currency</span>
            <CurrencySelector currency={user.currency} changesUsed={user.currencyChangeCount} />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Account</h2>
        <Card className="divide-y divide-divider p-0">
          <Link href="/profile/about" className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
            <Info size={17} className="text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text-primary">About</span>
            <ChevronRight size={16} className="text-text-muted" />
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="flex w-full items-center justify-center gap-2 px-4 py-3.5 hover:bg-surface-2">
              <LogOut size={17} className="text-error" />
              <span className="text-sm font-medium text-error">Sign out</span>
            </button>
          </form>
        </Card>
      </div>

      <ProfileLegalLinks />
    </div>
  );
}
