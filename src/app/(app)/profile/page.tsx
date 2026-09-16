import { LogOut, Coins } from "lucide-react";
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
import { AboutSection } from "@/components/profile/about-section";
import { NotificationPrefs } from "@/components/profile/notification-prefs";
import { ProfileLegalLinks } from "@/components/profile/profile-legal-links";
import { MAX_CURRENCY_CHANGES } from "@/lib/constants";
import { isUserVerified } from "@/lib/verified";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);
  const changesRemaining = Math.max(0, MAX_CURRENCY_CHANGES - user.currencyChangeCount);
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
          />
        </Card>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Preferences</h2>
        <Card className="divide-y divide-divider p-0">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-medium text-text-primary">Theme</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Coins size={17} className="text-text-muted" />
            <div className="flex flex-1 items-center gap-1.5">
              <span className="text-sm font-medium text-text-primary">Currency</span>
              <CurrencyInfo remaining={changesRemaining} />
            </div>
            <CurrencySelector currency={user.currency} changesUsed={user.currencyChangeCount} />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Account</h2>
        <Card className="p-0">
          <form action={signOutAction}>
            <button type="submit" className="flex w-full items-center justify-center gap-2 px-4 py-3.5 hover:bg-surface-2">
              <LogOut size={17} className="text-error" />
              <span className="text-sm font-medium text-error">Sign out</span>
            </button>
          </form>
        </Card>
      </div>

      <AboutSection />

      <ProfileLegalLinks />
    </div>
  );
}
