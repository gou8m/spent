"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Cake } from "lucide-react";
import { format, parse } from "date-fns";
import { birthdaySchema } from "@/lib/validations/profile";
import { updateBirthdayAction } from "@/actions/profile";
import { latestAdultBirthDate } from "@/lib/age";
import { Button } from "@/components/ui/button";
import { Label, FieldError } from "@/components/ui/input";
import { BirthDateField } from "@/components/ui/birth-date-field";
import { FieldRow } from "@/components/profile/field-row";

function BirthdayEditor({ initial, onDone }: { initial: string; onDone: () => void }) {
  const router = useRouter();
  const [dob, setDob] = useState(initial);
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
    toast.success("Birthday saved");
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <Label htmlFor="about-dob">Date of birth</Label>
        <BirthDateField id="about-dob" max={latestAdultBirthDate()} value={dob} onChange={setDob} error={!!error} />
        <FieldError>{error}</FieldError>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={!dob || dob === initial} loading={saving} loadingText="Saving…">
          Save
        </Button>
      </div>
    </form>
  );
}

/** The birthday as a saved row (like email). The first entry is free; after that it can change once. */
export function BirthdayRow({ dateOfBirth, changesUsed }: { dateOfBirth: string; changesUsed: number }) {
  const locked = !!dateOfBirth && changesUsed >= 1;
  const shown = dateOfBirth ? format(parse(dateOfBirth, "yyyy-MM-dd", new Date()), "d MMM yyyy") : null;
  return (
    <FieldRow
      icon={<Cake size={17} />}
      label="Birthday"
      value={shown}
      title={dateOfBirth ? "Change birthday" : "Add your birthday"}
      description={dateOfBirth ? "You can change your birthday only once." : "Spent is for people aged 18 or over."}
      locked={locked}
      lockedNote="Changed once"
    >
      {(close) => <BirthdayEditor initial={dateOfBirth} onDone={close} />}
    </FieldRow>
  );
}
