"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { FINANCE_NAV_ITEMS } from "@/lib/nav";
import { Sheet } from "@/components/ui/sheet";
import { useNavProgress } from "@/stores/ui-store";

export function MobileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const startProgress = useNavProgress((s) => s.start);

  function goTo(href: string) {
    setOpen(false);
    startProgress();
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menu"
        className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
      >
        <Menu size={19} strokeWidth={2} />
      </button>

      <Sheet open={open} onOpenChange={setOpen} title="Finance">
        <div className="grid grid-cols-2 gap-2.5 pb-2">
          {FINANCE_NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => goTo(item.href)}
              className="flex items-center gap-3 rounded-full bg-surface-2 px-4 py-3 text-left transition-colors hover:bg-surface-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-text-primary">
                <item.icon size={18} strokeWidth={1.9} />
              </span>
              <span className="truncate text-sm font-medium text-text-primary">{item.label}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
