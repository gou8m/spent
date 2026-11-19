"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { phoneSchemaFor } from "@/lib/validations/profile";
import { phonePlaceholder } from "@/lib/phone";
import { updatePhoneAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

/** The optional phone number. Leave it empty to remove it. */
export function PhoneForm({ phone, currency }: { phone: string; currency: string }) {
  const [saved, setSaved] = useState(phone);
  const [value, setValue] = useState(phone);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = phoneSchemaFor(currency).safeParse({ phone: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid phone number");
      return;
    }
    setSaving(true);
    const result = await updatePhoneAction(value);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    // Show the number as stored, with its country code.
    setSaved(result.phone ?? "");
    setValue(result.phone ?? "");
    toast.success("Saved");
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <Label htmlFor="about-phone">Phone (optional)</Label>
        <Input id="about-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={phonePlaceholder(currency)} value={value} onChange={(e) => setValue(e.target.value)} error={!!error} />
        <FieldError>{error}</FieldError>
      </div>
      <Button type="submit" className="w-full" disabled={value === saved} loading={saving} loadingText="Saving…">
        Save
      </Button>
    </form>
  );
}
