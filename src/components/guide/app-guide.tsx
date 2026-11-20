"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowUpDown, BarChart3, BookOpen, CalendarDays, ChevronRight, Handshake, Palette, PiggyBank, Plus, Repeat, Shapes, Shield, Target, Users, Wallet } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const SEEN_KEY = "spent:guideSeen";

const SLIDES = [
  { icon: Plus, title: "Add in seconds", text: "Tap + on Home or Transactions. Pick Expense, Income or Transfer, then amount, name and category." },
  { icon: Wallet, title: "Accounts", text: "Bank, cash, credit cards and savings in one list. Net worth updates as you go." },
  { icon: ArrowUpDown, title: "Transactions", text: "Search and filter by type, date, account or category. Tap a row to edit, copy or delete." },
  { icon: Shapes, title: "Categories", text: "Open the menu, then Categories, to rename, recolor or add your own." },
  { icon: PiggyBank, title: "Budgets", text: "Set a monthly limit per category and see what is left, day by day." },
  { icon: Target, title: "Goals", text: "Save towards something. Add money any time and watch the ring fill." },
  { icon: Repeat, title: "Recurring", text: "Rent, salary, subscriptions. Added on their day, even month-end or last working day." },
  { icon: Handshake, title: "Loans", text: "Lend or borrow, with or without interest. Repay in parts; interest is counted daily." },
  { icon: Users, title: "People", text: "Under Transactions, People gives a chat for everyone you lend to, borrow from or pay." },
  { icon: CalendarDays, title: "Calendar", text: "Bills, due dates, goals, festivals and holidays together. Tap a day to add to it." },
  { icon: BarChart3, title: "Reports", text: "See where money went: categories, trends and balances, by week, month or year." },
  { icon: Shield, title: "Backup and statements", text: "Download a backup or a PDF statement from Settings, and restore from a file." },
  { icon: Palette, title: "Make it yours", text: "Settings holds your profile, currency, alerts and themes. Ocean and Graphite restyle everything." },
];

const subscribe = () => () => {};

/** The short first-time tour. Opens by itself once for a new account; reopened from Settings. */
export function AppGuide({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  function finish() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Not remembered when storage is blocked.
    }
    onOpenChange(false);
    setTimeout(() => setIndex(0), 300);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : finish())} title="Quick tour" hideHeader>
      <div className="flex flex-col items-center px-2 pb-2 pt-2 text-center">
        <div key={index} className="animate-fade-up flex flex-col items-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-accent text-text-on-accent">
            <slide.icon size={36} strokeWidth={2} />
          </span>
          <h2 className="mt-5 text-[1.5rem] font-extrabold tracking-tight text-text-primary">{slide.title}</h2>
          <p className="mt-2 min-h-[4.5rem] max-w-xs text-[0.9375rem] text-text-secondary">{slide.text}</p>
        </div>

        <div className="mt-6 w-full" aria-hidden>
          <div className="h-1.5 overflow-hidden rounded-full bg-border-strong/50">
            <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${((index + 1) / SLIDES.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-text-muted">
            {index + 1} of {SLIDES.length}
          </p>
        </div>

        <div className="mt-5 grid w-full grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" onClick={() => (index === 0 ? finish() : setIndex(index - 1))}>
            {index === 0 ? "Skip" : "Back"}
          </Button>
          <Button size="lg" onClick={() => (last ? finish() : setIndex(index + 1))}>
            {last ? "Start" : "Next"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/** Opens the tour once for a brand-new account (created in the last two weeks) that has not seen it. */
export function GuideAutoOpen({ createdAt }: { createdAt: string }) {
  const unseen = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(SEEN_KEY) !== "1";
      } catch {
        return false;
      }
    },
    () => false,
  );
  const fresh = new Date(createdAt).getTime() > new Date().getTime() - 14 * 24 * 60 * 60 * 1000;
  const [dismissed, setDismissed] = useState(false);
  return <AppGuide open={unseen && fresh && !dismissed} onOpenChange={(o) => !o && setDismissed(true)} />;
}

/** The "App guide" row in Settings. */
export function GuideRow() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex h-13 w-full items-center gap-3.5 px-4 text-left hover:bg-surface-3">
        <BookOpen size={22} strokeWidth={2} className="shrink-0 text-accent-text" />
        <span className="flex-1 text-base font-semibold text-text-primary">App guide</span>
        <ChevronRight size={19} strokeWidth={2} className="shrink-0 text-text-secondary" />
      </button>
      <AppGuide open={open} onOpenChange={setOpen} />
    </>
  );
}
