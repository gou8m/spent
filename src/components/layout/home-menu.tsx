"use client";

import { useState } from "react";
import { SheetLink } from "@/components/ui/sheet-link";
import { Menu } from "lucide-react";
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
        {/* Three tiles across: icon on top, name underneath. */}
        <ul className="grid grid-cols-3 gap-2.5 pb-2">
          {items.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <SheetLink
                href={href}
                onNavigate={() => setOpen(false)}
                className="flex aspect-square flex-col items-center justify-center gap-2.5 rounded-[22px] bg-surface-2 px-1.5 text-center transition-colors active:scale-[0.97] hover:bg-surface-3"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-surface text-accent">
                  <Icon size={24} strokeWidth={2} />
                </span>
                <span className="text-[0.8125rem] font-semibold leading-tight text-text-primary">{label}</span>
              </SheetLink>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
