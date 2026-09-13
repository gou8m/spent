"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { IconChip } from "@/components/ui/icon-chip";
import { AVATAR_PRESETS, getAvatarPreset } from "@/lib/avatars";
import { cn } from "@/lib/utils";

export function AvatarPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const preset = getAvatarPreset(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Choose profile photo">
          <IconChip icon={preset.icon} color={preset.color} size="lg" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3.5" align="start">
        <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">Profile photo</p>
        <div className="grid grid-cols-5 gap-2">
          {AVATAR_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-label={p.id}
              onClick={() => {
                onChange(p.id);
                setOpen(false);
              }}
              className={cn(
                "rounded-full ring-offset-2 ring-offset-surface transition-shadow",
                value === p.id && "ring-2 ring-accent",
              )}
            >
              <IconChip icon={p.icon} color={p.color} size="md" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
