"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { IconChip } from "@/components/ui/icon-chip";
import { UserAvatar } from "@/components/ui/user-avatar";
import { AVATAR_PRESETS, getInitial } from "@/lib/avatars";
import { updateAvatarPresetAction } from "@/actions/profile";
import { cn } from "@/lib/utils";

export function AvatarPicker({ value, name }: { value: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function pickPreset(id: string) {
    setOpen(false);
    const result = await updateAvatarPresetAction(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Choose avatar">
          <UserAvatar avatar={value} name={name} size="lg" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3.5" align="start">
        <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">Choose an icon</p>
        <div className="grid grid-cols-5 gap-2">
          {AVATAR_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-label={p.id}
              onClick={() => pickPreset(p.id)}
              className={cn(
                "rounded-full ring-offset-2 ring-offset-surface transition-shadow",
                value === p.id && "ring-2 ring-accent",
              )}
            >
              {p.id === "avatar-1" ? (
                <IconChip initial={getInitial(name)} color={p.color} size="md" />
              ) : (
                <IconChip icon={p.icon} color={p.color} size="md" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
