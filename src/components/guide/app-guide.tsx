"use client";

import { useState, useSyncExternalStore } from "react";
import { BookOpen, ChevronRight, Handshake, PiggyBank, Plus, Wallet } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SEEN_KEY = "spent:guideSeen";

const SLIDES = [
  { icon: Plus, title: "Add in seconds", text: "Tap + on Home or Transactions. Amount, who, category, done." },
  { icon: Wallet, title: "Accounts hold your money", text: "Bank, cash, cards and savings. Balances update on their own." },
  { icon: Handshake, title: "People and loans", text: "Lend, borrow and repay. Each person gets a chat of what is owed." },
  { icon: PiggyBank, title: "Budgets and goals", text: "Set a limit, save towards a goal, and see what is left." },
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
          <p className="mt-2 max-w-xs text-[0.9375rem] text-text-secondary">{slide.text}</p>
        </div>

        <div className="mt-6 flex items-center gap-1.5" aria-hidden>
          {SLIDES.map((_, i) => (
            <span key={i} className={cn("h-2 rounded-full transition-all duration-300", i === index ? "w-6 bg-accent" : "w-2 bg-border-strong")} />
          ))}
        </div>

        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" onClick={finish}>
            {last ? "Close" : "Skip"}
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
      <button type="button" onClick={() => setOpen(true)} className="flex h-11.5 w-full items-center gap-3.5 px-4 text-left hover:bg-surface-3">
        <BookOpen size={20} strokeWidth={2} className="shrink-0 text-accent-text" />
        <span className="flex-1 text-[0.9375rem] font-semibold text-text-primary">App guide</span>
        <ChevronRight size={17} strokeWidth={2} className="shrink-0 text-text-secondary" />
      </button>
      <AppGuide open={open} onOpenChange={setOpen} />
    </>
  );
}
