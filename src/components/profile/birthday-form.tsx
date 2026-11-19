"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { birthdaySchema } from "@/lib/validations/profile";
import { updateBirthdayAction } from "@/actions/profile";
import { latestAdultBirthDate } from "@/lib/age";
import { Button } from "@/components/ui/button";
import { Label, FieldError } from "@/components/ui/input";
import { BirthDateField } from "@/components/ui/birth-date-field";

/** Date of birth: Spent is 18+, and it is how the birthday wish knows the day. */
export function BirthdayForm({ dateOfBirth }: { dateOfBirth: string }) {
  const [dob, setDob] = useState(dateOfBirth);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = birthdaySchema.safeParse({ dateOfBirth: dob });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter your date of birth");
      return;
    }
    setSaving(true);
    const result = await updateBirthdayAction(parsed.data.dateOfBirth);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success("Saved");
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <Label htmlFor="about-dob">Date of birth</Label>
        <BirthDateField id="about-dob" max={latestAdultBirthDate()} value={dob} onChange={setDob} error={!!error} />
        <FieldError>{error}</FieldError>
      </div>
      <Button type="submit" className="w-full" disabled={dob === dateOfBirth} loading={saving} loadingText="Saving…">
        Save
      </Button>
    </form>
  );
}
