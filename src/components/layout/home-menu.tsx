"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronRight } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { NAV_ITEMS, FINANCE_NAV_ITEMS } from "@/lib/nav";

/** The three-lines button in the mobile Home header: opens every page that is not one of
 * the bottom bar's tabs (Budgets, Categories, Goals, Recurring, Reports). */
export function HomeMenu() {
  const [open, setOpen] = useState(false);
  const inTabBar = new Set(NAV_ITEMS.map((i) => i.href));
  // Alphabetical. Profile is reached from the Settings name card; Backup & restore from Settings > Data.
  const items = FINANCE_NAV_ITEMS.filter((i) => !inTabBar.has(i.href) && i.href !== "/import-export").sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
      >
        <Menu size={22} strokeWidth={2} />
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="Menu">
        <ul className="flex flex-col gap-2 pb-2">
          {items.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3.5 rounded-[22px] bg-surface-2 px-4 py-3 transition-colors hover:bg-surface-3"
              >
                <span className="flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-[14px] bg-surface text-accent">
                  <Icon size={22} strokeWidth={2} />
                </span>
                <span className="flex-1 text-base font-semibold text-text-primary">{label}</span>
                <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-text-secondary" />
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
