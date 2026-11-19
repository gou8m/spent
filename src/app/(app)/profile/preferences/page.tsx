import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { BackHeader } from "@/components/layout/back-header";
import { PaletteSwatches, ThemeTiles } from "@/components/theme-toggle";
import { CurrencySelector } from "@/components/profile/currency-selector";

const label = "mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary";

export default async function PreferencesPage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);
  const alerts = [user.notifyBills, user.notifyBudgets, user.notifyGoals, user.notifySubscriptions, user.notifyHolidays, user.notifyLoans];
  const alertsOn = alerts.filter(Boolean).length;

  return (
    <div className="max-w-2xl space-y-5">
      <BackHeader href="/profile" title="Preferences" />

      <section>
        <h2 className={label}>Primary currency</h2>
        <CurrencySelector currency={user.currency} changesUsed={user.currencyChangeCount} variant="row" />
        <p className="mt-2 text-xs leading-snug text-text-secondary">
          Changing currency does not convert existing amounts. You can change it up to 3 times.
        </p>
      </section>

      <section>
        <h2 className={label}>Theme</h2>
        <ThemeTiles />
      </section>

      <section>
        <h2 className={label}>Color theme</h2>
        <div className="rounded-[22px] bg-surface-2 p-3">
          <PaletteSwatches />
        </div>
      </section>

      <section>
        <h2 className={label}>Alerts</h2>
        <Link
          href="/profile/notifications"
          className="flex items-center gap-3 rounded-[22px] bg-surface-2 px-4 py-3 transition-colors hover:bg-surface-3"
        >
          <span className="flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-[14px] bg-surface text-accent">
            <Bell size={22} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-text-primary">Notifications</span>
            <span className="block text-xs text-text-secondary">
              {alertsOn} of {alerts.length} on
            </span>
          </span>
          <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-text-secondary" />
        </Link>
      </section>
    </div>
  );
}
