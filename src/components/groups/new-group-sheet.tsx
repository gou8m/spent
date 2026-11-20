"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Users, X } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGroupAction } from "@/actions/split";
import { CURRENCIES } from "@/lib/constants";

/** Names only: the people in a group do not need Spent. You are always in it. */
export function NewGroupSheet({ open, onOpenChange, currency, formKey }: { open: boolean; onOpenChange: (open: boolean) => void; currency: string; formKey: number }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="New group">
      <NewGroupForm key={formKey} currency={currency} />
    </Sheet>
  );
}

function NewGroupForm({ currency }: { currency: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState(currency);
  const [person, setPerson] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function addPerson() {
    const n = person.trim();
    if (!n) return;
    if (n.toLowerCase() === "you" || people.some((p) => p.toLowerCase() === n.toLowerCase())) {
      setError("Each person needs a different name");
      return;
    }
    setError(undefined);
    setPeople((p) => [...p, n]);
    setPerson("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!name.trim()) return setError("Enter a group name");
    // A name typed but not added yet still counts.
    const pending = person.trim();
    const all = pending && !people.some((p) => p.toLowerCase() === pending.toLowerCase()) ? [...people, pending] : people;
    setSaving(true);
    const res = await createGroupAction({ name, currency: code, members: all });
    setSaving(false);
    if (res.error || !res.id) return setError(res.error ?? "Could not create the group");
    toast.success("Group created");
    // The sheet goes away with the page; closing it first would undo the navigation (it steps back in history).
    router.push(`/groups/${res.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4 pb-6 pt-2">
      <div>
        <Label htmlFor="group-name">Group name</Label>
        <Input id="group-name" placeholder="e.g. Goa trip, Flat" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Currency</Label>
        <Select value={code} onValueChange={setCode}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="group-person">Who is in it</Label>
        <div className="flex gap-2">
          <Input
            id="group-person"
            placeholder="Add a name"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPerson();
              }
            }}
          />
          <Button type="button" variant="secondary" aria-label="Add this person" onClick={addPerson}>
            <Plus size={18} strokeWidth={2.25} />
          </Button>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <span className="inline-flex h-9 items-center rounded-full bg-accent-subtle px-3.5 text-sm font-bold text-accent-hover">You</span>
          {people.map((p) => (
            <span key={p} className="animate-fade-in inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-2 pl-3.5 pr-2 text-sm font-semibold text-text-primary">
              {p}
              <button type="button" aria-label={`Remove ${p}`} onClick={() => setPeople((l) => l.filter((x) => x !== p))} className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-text-secondary">
                <X size={13} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" size="lg" className="w-full" loading={saving} loadingText="Creating…">
        <Users size={18} strokeWidth={2} />
        Create group
      </Button>
    </form>
  );
}
