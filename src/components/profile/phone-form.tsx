"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import { phoneSchemaFor } from "@/lib/validations/profile";
import { dialCodeFor, phonePlaceholder } from "@/lib/phone";
import { updatePhoneAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { FieldRow } from "@/components/profile/field-row";

function PhoneEditor({ initial, currency, onDone }: { initial: string; currency: string; onDone: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
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
    toast.success(value.trim() ? "Phone saved" : "Phone removed");
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <Label htmlFor="about-phone">Phone number</Label>
        <Input
          id="about-phone"
          type="tel"
          inputMode={dialCodeFor(currency) ? "numeric" : "tel"}
          autoComplete="tel"
          placeholder={phonePlaceholder(currency)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={!!error}
        />
        <FieldError>{error}</FieldError>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={value === initial} loading={saving} loadingText="Saving…">
          Save
        </Button>
      </div>
    </form>
  );
}

/** The phone number as a saved row (like email), changeable any time. Empty the box to remove it. */
export function PhoneRow({ phone, currency }: { phone: string; currency: string }) {
  return (
    <FieldRow
      icon={<Phone size={17} />}
      label="Phone"
      value={phone || null}
      title={phone ? "Change phone" : "Add phone"}
      description="Optional. Leave it empty to remove it."
    >
      {(close) => <PhoneEditor initial={phone} currency={currency} onDone={close} />}
    </FieldRow>
  );
}
