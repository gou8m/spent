"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateNotificationPrefsAction } from "@/actions/profile";
import { Toggle } from "@/components/ui/toggle";

export function NotificationPrefs({
  notifyBills,
  notifyBudgets,
  notifyGoals,
  notifyHolidays,
  notifyLoans,
}: {
  notifyBills: boolean;
  notifyBudgets: boolean;
  notifyGoals: boolean;
  notifyHolidays: boolean;
  notifyLoans: boolean;
}) {
  const [prefs, setPrefs] = useState({ notifyBills, notifyBudgets, notifyGoals, notifyHolidays, notifyLoans });
  const [pending, setPending] = useState<keyof typeof prefs | null>(null);

  async function toggle(key: keyof typeof prefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setPending(key);
    const result = await updateNotificationPrefsAction(next);
    setPending(null);
    if (result.error) {
      setPrefs(prefs); // revert
      toast.error(result.error);
    }
  }

  const rows = [
    { key: "notifyBills" as const, label: "Upcoming bills" },
    { key: "notifyBudgets" as const, label: "Budget alerts" },
    { key: "notifyGoals" as const, label: "Goal milestones" },
    { key: "notifyHolidays" as const, label: "Holidays & festivals" },
    { key: "notifyLoans" as const, label: "Loan reminders" },
  ];

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.key} className="flex min-h-15 items-center justify-between gap-3 rounded-[20px] bg-surface-2 px-4 py-2">
          <p className="truncate text-[0.9375rem] font-semibold text-text-primary">{row.label}</p>
          <Toggle checked={prefs[row.key]} onCheckedChange={() => toggle(row.key)} disabled={pending === row.key} label={row.label} />
        </div>
      ))}
    </div>
  );
}
