"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { IconChip } from "@/components/ui/icon-chip";
import { SWATCH_IDS, getSwatch } from "@/lib/colors";
import { ICON_NAMES, getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function IconColorPicker({
  icon,
  color,
  onChange,
}: {
  icon: string;
  color: string;
  onChange: (value: { icon: string; color: string }) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Choose icon and color">
          <IconChip icon={icon} color={color} size="lg" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3.5" align="start">
        <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">Color</p>
        <div className="flex flex-wrap gap-2">
          {SWATCH_IDS.map((id) => {
            const swatch = getSwatch(id);
            return (
              <button
                key={id}
                type="button"
                aria-label={swatch.label}
                onClick={() => onChange({ icon, color: id })}
                className={cn(
                  "h-7 w-7 rounded-full ring-offset-2 ring-offset-surface transition-shadow",
                  color === id && "ring-2 ring-accent",
                )}
                style={{ background: swatch.light.fg }}
              />
            );
          })}
        </div>

        <p className="mb-2 mt-3.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">Icon</p>
        <div className="grid max-h-48 grid-cols-6 gap-1 overflow-y-auto">
          {ICON_NAMES.map((name) => {
            const Icon = getIcon(name);
            return (
              <button
                key={name}
                type="button"
                aria-label={name}
                onClick={() => onChange({ icon: name, color })}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-2",
                  icon === name && "bg-accent-subtle text-accent-text",
                )}
              >
                <Icon size={17} strokeWidth={2} />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
