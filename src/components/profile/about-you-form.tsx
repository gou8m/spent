"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { aboutSchema } from "@/lib/validations/profile";
import { updateAboutAction } from "@/actions/profile";
import { latestAdultBirthDate } from "@/lib/age";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

/** Date of birth (Spent is 18+, and it is how the birthday wish knows the day) and an optional phone number. */
export function AboutYouForm({ dateOfBirth, phone }: { dateOfBirth: string; phone: string }) {
  const [dob, setDob] = useState(dateOfBirth);
  const [tel, setTel] = useState(phone);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty = dob !== dateOfBirth || tel !== phone;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = aboutSchema.safeParse({ dateOfBirth: dob, phone: tel });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form for errors");
      return;
    }
    setSaving(true);
    const result = await updateAboutAction(parsed.data);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success("Saved");
  }

  return (
    <form onSubmit={handleSave} className="space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="about-dob">Date of birth</Label>
          <Input id="about-dob" type="date" autoComplete="bday" max={latestAdultBirthDate()} value={dob} onChange={(e) => setDob(e.target.value)} error={!!error} />
        </div>
        <div>
          <Label htmlFor="about-phone">Phone (optional)</Label>
          <Input id="about-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91" value={tel} onChange={(e) => setTel(e.target.value)} />
        </div>
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" className="w-full" disabled={!dirty} loading={saving} loadingText="Saving…">
        Save
      </Button>
    </form>
  );
}
