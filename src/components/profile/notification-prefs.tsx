"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateNotificationPrefsAction } from "@/actions/profile";

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-accent" : "bg-border-strong"}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export function NotificationPrefs({
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
  const [prefs, setPrefs] = useState({ notifyBills, notifyBudgets, notifyGoals, notifySubscriptions, notifyHolidays, notifyLoans });
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
    { key: "notifySubscriptions" as const, label: "Subscription price changes" },
    { key: "notifyHolidays" as const, label: "Holidays & festivals" },
    { key: "notifyLoans" as const, label: "Loan reminders" },
  ];

  return (
    <>
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-3 px-4 py-3.5">
          <p className="truncate text-sm font-medium text-text-primary">{row.label}</p>
          <Toggle checked={prefs[row.key]} onChange={() => toggle(row.key)} disabled={pending === row.key} label={row.label} />
        </div>
      ))}
    </>
  );
}
