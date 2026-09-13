"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { accountSchema } from "@/lib/validations/account";
import { createAccountAction, updateAccountAction } from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { IconColorPicker } from "@/components/ui/icon-color-picker";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { CURRENCIES } from "@/lib/constants";
import type { SwatchId } from "@/lib/colors";

export interface EditableAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  startingBalance: number;
  icon: string;
  color: string;
}

export function AccountForm({
  editing,
  onSaved,
  onDiscard,
}: {
  editing?: EditableAccount;
  onSaved: () => void;
  onDiscard?: () => void;
}) {
  const isEditing = !!editing;
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState(editing?.type ?? "BANK");
  const [currency, setCurrency] = useState(editing?.currency ?? "USD");
  const [startingBalance, setStartingBalance] = useState(editing ? String(editing.startingBalance / 100) : "0");
  const [icon, setIcon] = useState(editing?.icon ?? "wallet");
  const [color, setColor] = useState<SwatchId>((editing?.color as SwatchId) ?? "blue");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = { name, type, currency, startingBalance: Number(startingBalance || 0), icon, color };
    const parsed = accountSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const result = isEditing
      ? await updateAccountAction(editing.id, parsed.data)
      : await createAccountAction(parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEditing ? "Account updated" : "Account added");
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <IconColorPicker icon={icon} color={color} onChange={(v) => { setIcon(v.icon); setColor(v.color as SwatchId); }} />
        <div className="flex-1">
          <Label htmlFor="name">Account name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chase Checking" error={!!errors.name} />
          <FieldError>{errors.name}</FieldError>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="startingBalance">{isEditing ? "Starting balance" : "Current balance"}</Label>
        <Input
          id="startingBalance"
          inputMode="decimal"
          value={startingBalance}
          onChange={(e) => setStartingBalance(e.target.value.replace(/[^0-9.-]/g, ""))}
          error={!!errors.startingBalance}
        />
        <FieldError>{errors.startingBalance}</FieldError>
      </div>

      <div className="flex items-center gap-3">
        {isEditing && onDiscard && (
          <Button type="button" variant="outline" onClick={onDiscard} disabled={isSubmitting}>
            Discard
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Add account"}
        </Button>
      </div>
    </form>
  );
}
