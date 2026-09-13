"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { IconChip } from "@/components/ui/icon-chip";
import { UserAvatar } from "@/components/ui/user-avatar";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { updateAvatarPresetAction, uploadAvatarAction } from "@/actions/profile";
import { cn } from "@/lib/utils";

export function AvatarPicker({ value }: { value: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function pickPreset(id: string) {
    setOpen(false);
    const result = await updateAvatarPresetAction(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadAvatarAction(formData);
    setIsUploading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile photo updated");
    setOpen(false);
    router.refresh();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Choose profile photo">
          <UserAvatar avatar={value} size="lg" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3.5" align="start">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-surface-2 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-3 disabled:opacity-50"
        >
          <Upload size={15} strokeWidth={2.25} />
          {isUploading ? "Uploading…" : "Upload a photo"}
        </button>

        <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">Or choose an icon</p>
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
              <IconChip icon={p.icon} color={p.color} size="md" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
