"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { updateNotificationPrefsAction } from "@/actions/profile";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
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
}: {
  notifyBills: boolean;
  notifyBudgets: boolean;
  notifyGoals: boolean;
}) {
  const [prefs, setPrefs] = useState({ notifyBills, notifyBudgets, notifyGoals });
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
    { key: "notifyBills" as const, label: "Upcoming bills", description: "Recurring charges due within 7 days" },
    { key: "notifyBudgets" as const, label: "Budget alerts", description: "A budget is 80%+ spent" },
    { key: "notifyGoals" as const, label: "Goal milestones", description: "A goal reaches 90%+ funded" },
  ];

  return (
    <>
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-1">
            <p className="truncate text-sm font-medium text-text-primary">{row.label}</p>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`About ${row.label}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-secondary"
                >
                  <Info size={14} strokeWidth={2} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 text-sm text-text-secondary" align="start">
                {row.description}
              </PopoverContent>
            </Popover>
          </div>
          <Toggle checked={prefs[row.key]} onChange={() => toggle(row.key)} disabled={pending === row.key} />
        </div>
      ))}
    </>
  );
}
