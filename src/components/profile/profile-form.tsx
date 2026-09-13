"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { profileSchema } from "@/lib/validations/profile";
import { updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { AvatarPicker } from "@/components/ui/avatar-picker";

export function ProfileForm({ name, avatar, email }: { name: string; avatar: string; email: string }) {
  const [displayName, setDisplayName] = useState(name);
  const [avatarId, setAvatarId] = useState(avatar);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = profileSchema.safeParse({ name: displayName, avatar: avatarId });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const result = await updateProfileAction(parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <AvatarPicker value={avatarId} onChange={setAvatarId} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{displayName || "Account"}</p>
          <p className="truncate text-sm text-text-secondary">{email}</p>
        </div>
      </div>

      <div>
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={!!errors.name}
        />
        <FieldError>{errors.name}</FieldError>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
