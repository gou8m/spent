"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { ICON_LIBRARY } from "@/lib/icon-library";
import { cn } from "@/lib/utils";

/**
 * Every icon the app offers, grouped (Transport, Money & banking, Giving & family, Food…) with a
 * search box that also matches what people call things: "atm" finds cash withdrawal, "relatives"
 * finds the family icons, "train" or "bus" or "bike" find the transport ones. Opens as its own
 * sheet on top of whatever form asked for it.
 */
export function IconLibraryPicker({
  open,
  onOpenChange,
  value,
  onSelect,
  color,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (name: string) => void;
  /** Tint of the selected tile, to match the colour already chosen in the form. */
  color?: { bg: string; fg: string };
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!q) return ICON_LIBRARY;
    const words = q.split(/\s+/);
    return ICON_LIBRARY.map((g) => ({
      group: g.group,
      icons: g.icons.filter((i) => words.every((w) => i.keywords.includes(w) || i.name.includes(w))),
    })).filter((g) => g.icons.length > 0);
  }, [q]);

  const total = groups.reduce((n, g) => n + g.icons.length, 0);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) setQuery("");
        onOpenChange(o);
      }}
      title="Choose an icon"
      stackLevel={1}
    >
      <div className="min-h-[60vh] space-y-4">
        <label className="flex h-12 items-center gap-2.5 rounded-[18px] bg-surface-2 px-4 text-text-secondary">
          <Search size={18} className="shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: atm, train, donation, gym…"
            aria-label="Search icons"
            className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-text-primary outline-none placeholder:text-text-secondary"
          />
        </label>

        {total === 0 ? (
          <p className="rounded-[22px] bg-surface-2 px-4 py-8 text-center text-sm text-text-secondary">No icon matches &ldquo;{query}&rdquo;. Try another word.</p>
        ) : (
          groups.map((g) => (
            <section key={g.group}>
              <h3 className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">{g.group}</h3>
              <div className="grid grid-cols-4 gap-2">
                {g.icons.map(({ name, label, Icon }) => {
                  const selected = value === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      aria-label={label}
                      aria-pressed={selected}
                      onClick={() => {
                        onSelect(name);
                        setQuery("");
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex min-h-19 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-1 py-2 text-center transition-colors",
                        selected ? "border-accent" : "border-transparent bg-surface-2 text-text-secondary hover:bg-surface-3",
                      )}
                      style={selected && color ? { background: color.bg, color: color.fg } : undefined}
                    >
                      <Icon size={24} strokeWidth={2} />
                      <span className="line-clamp-2 w-full text-[0.625rem] font-semibold leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </Sheet>
  );
}
