"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Landmark, Plus, Calculator, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTransactionSheet } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "spent:dismissedGetStarted";

export function GetStartedChecklist({
  checklist,
}: {
  checklist: { createdAccount: boolean; addedAccount: boolean; addedTransaction: boolean; setBudget: boolean };
}) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const openTransactionSheet = useTransactionSheet((s) => s.open);

  const items = [
    { key: "createdAccount", label: "Create your account", caption: null, done: checklist.createdAccount },
    { key: "addedAccount", label: "Add an account", caption: "Bank, cash or card", done: checklist.addedAccount, href: "/accounts" },
    {
      key: "addedTransaction",
      label: "Add your first transaction",
      caption: "Takes about 10 seconds",
      done: checklist.addedTransaction,
      onClick: () => openTransactionSheet(),
    },
    { key: "setBudget", label: "Set a monthly budget", caption: "See what is left to spend", done: checklist.setBudget, href: "/budgets" },
  ];
  const doneCount = items.filter((i) => i.done).length;

  if (dismissed || doneCount === items.length) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage unavailable (private mode, etc.) — dismissal just won't persist.
    }
  }

  return (
    <div className="rounded-lg bg-surface-2 p-4.5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-text-primary">Get started</h2>
        <span className="text-[0.8125rem] font-bold text-accent-text">
          {doneCount} of {items.length} done
        </span>
      </div>
      <Progress value={(doneCount / items.length) * 100} label={`${doneCount} of ${items.length} steps done`} className="mt-3" />

      <div className="mt-3.5 flex flex-col gap-2">
        {items.map((item) => {
          if (item.done) {
            return (
              <div key={item.key} className="flex items-center gap-3 rounded-md bg-accent-subtle px-3 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-accent text-text-on-accent">
                  <Check size={18} strokeWidth={2.5} />
                </span>
                <span className="text-[0.9375rem] font-semibold text-accent-hover">{item.label}</span>
              </div>
            );
          }

          const Icon = item.key === "addedAccount" ? Landmark : item.key === "setBudget" ? Calculator : Plus;
          const content = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-surface text-accent-text">
                <Icon size={18} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-semibold text-text-primary">{item.label}</span>
                <span className="block text-xs text-text-secondary">{item.caption}</span>
              </span>
              <ChevronRight size={18} strokeWidth={2} className="shrink-0 text-text-secondary" />
            </>
          );

          return item.href ? (
            <Link key={item.key} href={item.href} className={cn("flex w-full items-center gap-3 rounded-md bg-surface px-3 py-2 text-left")}>
              {content}
            </Link>
          ) : (
            <button key={item.key} type="button" onClick={item.onClick} className="flex w-full items-center gap-3 rounded-md bg-surface px-3 py-2 text-left">
              {content}
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-center">
        <button type="button" onClick={dismiss} className="h-9 px-3 text-[0.8125rem] font-bold text-text-secondary">
          Dismiss
        </button>
      </div>
    </div>
  );
}
