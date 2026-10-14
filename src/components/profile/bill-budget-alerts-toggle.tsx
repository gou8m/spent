"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Toggle } from "@/components/ui/toggle";
import { updateNotificationPrefsAction } from "@/actions/profile";

/** A single combined switch over the two most time-sensitive notification
 * categories (upcoming bills, over-budget alerts) — the full per-category
 * breakdown (goals, subscriptions, holidays, loans) stays on the Notifications
 * screen; this is the one-tap shortcut the reference shows directly in Settings.
 * Takes every pref (not just bills/budgets) so toggling this one doesn't
 * silently reset whatever the user already chose for the other four. */
export function BillBudgetAlertsToggle({
  notifyBills,
  notifyBudgets,
  notifyGoals,
  notifySubscriptions,
  notifyHolidays,
  notifyLoans,
}: {
  notifyBills: boolean;
  notifyBudgets: boolean;
  notifyGoals: boolean;
  notifySubscriptions: boolean;
  notifyHolidays: boolean;
  notifyLoans: boolean;
}) {
  const [checked, setChecked] = useState(notifyBills && notifyBudgets);
  const [pending, setPending] = useState(false);

  async function handleChange(next: boolean) {
    setChecked(next);
    setPending(true);
    const result = await updateNotificationPrefsAction({
      notifyBills: next,
      notifyBudgets: next,
      notifyGoals,
      notifySubscriptions,
      notifyHolidays,
      notifyLoans,
    });
    setPending(false);
    if (result.error) {
      setChecked(!next);
      toast.error(result.error);
    }
  }

  return <Toggle checked={checked} onCheckedChange={handleChange} label="Bill & budget alerts" disabled={pending} />;
}
