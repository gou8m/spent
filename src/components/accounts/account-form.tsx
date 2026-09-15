"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { accountSchema } from "@/lib/validations/account";
import { createAccountAction, updateAccountAction } from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { IconColorPicker } from "@/components/ui/icon-color-picker";
import { ACCOUNT_TYPES, BANK_SUBTYPES, ACCOUNT_TYPE_ICONS } from "@/lib/constants";
import { CURRENCIES } from "@/lib/constants";
import type { SwatchId } from "@/lib/colors";

export interface EditableAccount {
  id: string;
  name: string;
  type: string;
  bankSubtype: string | null;
  currency: string;
  startingBalance: number;
  creditLimit: number | null;
  allowExpense: boolean;
  isEmergencyFund: boolean;
  icon: string;
  color: string;
}

export function AccountForm({
  editing,
  defaultCurrency = "USD",
  onSaved,
  onDiscard,
}: {
  editing?: EditableAccount;
  defaultCurrency?: string;
  onSaved: () => void;
  onDiscard?: () => void;
}) {
  const isEditing = !!editing;
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState(editing?.type ?? "BANK");
  const [bankSubtype, setBankSubtype] = useState(editing?.bankSubtype ?? "SAVINGS");
  const [currency, setCurrency] = useState(editing?.currency ?? defaultCurrency);
  const [startingBalance, setStartingBalance] = useState(editing ? String(editing.startingBalance / 100) : "0");
  const [creditLimit, setCreditLimit] = useState(editing?.creditLimit ? String(editing.creditLimit / 100) : "");
  // CREDIT_CARD only — how much of the limit is already spent. Maps to a negative
  // startingBalance under the hood (see payload below) rather than a separate column.
  const [alreadyUsed, setAlreadyUsed] = useState(
    editing?.type === "CREDIT_CARD" && editing.startingBalance < 0 ? String(-editing.startingBalance / 100) : "",
  );
  const [allowExpense, setAllowExpense] = useState(editing?.allowExpense ?? true);
  const [isEmergencyFund, setIsEmergencyFund] = useState(editing?.isEmergencyFund ?? false);
  const [icon, setIcon] = useState(editing?.icon ?? "wallet");
  const [color, setColor] = useState<SwatchId>((editing?.color as SwatchId) ?? "blue");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      name,
      type,
      bankSubtype: type === "BANK" ? bankSubtype : undefined,
      currency,
      startingBalance: type === "CREDIT_CARD" ? -Number(alreadyUsed || 0) : Number(startingBalance || 0),
      creditLimit: type === "CREDIT_CARD" && creditLimit ? Number(creditLimit) : undefined,
      allowExpense: type === "SAVINGS" ? allowExpense : undefined,
      isEmergencyFund: type === "SAVINGS" ? isEmergencyFund : undefined,
      icon,
      color,
    };
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
        <IconColorPicker
          icon={icon}
          color={color}
          icons={ACCOUNT_TYPE_ICONS[type]}
          onChange={(v) => { setIcon(v.icon); setColor(v.color as SwatchId); }}
        />
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

      {type === "BANK" && (
        <div>
          <Label>Account type</Label>
          <Select value={bankSubtype} onValueChange={setBankSubtype}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BANK_SUBTYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === "CREDIT_CARD" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="creditLimit">Credit limit</Label>
            <Input
              id="creditLimit"
              inputMode="decimal"
              placeholder="0.00"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value.replace(/[^0-9.]/g, ""))}
              error={!!errors.creditLimit}
            />
            <FieldError>{errors.creditLimit}</FieldError>
          </div>
          <div>
            <Label htmlFor="alreadyUsed">Already used</Label>
            <Input
              id="alreadyUsed"
              inputMode="decimal"
              placeholder="0.00"
              value={alreadyUsed}
              onChange={(e) => setAlreadyUsed(e.target.value.replace(/[^0-9.]/g, ""))}
              error={!!errors.startingBalance}
            />
            <FieldError>{errors.startingBalance}</FieldError>
          </div>
        </div>
      ) : (
        <div>
          <Label htmlFor="startingBalance">Starting balance</Label>
          <Input
            id="startingBalance"
            inputMode="decimal"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value.replace(/[^0-9.-]/g, ""))}
            error={!!errors.startingBalance}
          />
          <FieldError>{errors.startingBalance}</FieldError>
        </div>
      )}

      {type === "SAVINGS" && (
        <>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Use for daily expenses?</p>
              <p className="text-xs text-text-muted">Off keeps it out of the account list when you&apos;re logging an expense.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={allowExpense}
              aria-label="Use for daily expenses?"
              onClick={() => setAllowExpense(!allowExpense)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${allowExpense ? "bg-accent" : "bg-border-strong"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${allowExpense ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">This is my Emergency Fund</p>
              <p className="text-xs text-text-muted">
                Recurring rules categorized &ldquo;Emergency Fund&rdquo; send money here automatically. Only one account can hold this.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isEmergencyFund}
              aria-label="This is my Emergency Fund"
              onClick={() => setIsEmergencyFund(!isEmergencyFund)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${isEmergencyFund ? "bg-accent" : "bg-border-strong"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isEmergencyFund ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </>
      )}

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
