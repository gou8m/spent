"use client";

import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { goalSchema } from "@/lib/validations/goal";
import { createGoalAction, updateGoalAction } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { IconColorPicker } from "@/components/ui/icon-color-picker";
import type { SwatchId } from "@/lib/colors";

const NO_ACCOUNT = "none";

export interface AccountOption {
  id: string;
  name: string;
  currency: string;
}

export interface EditableGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: Date | null;
  accountId: string | null;
  icon: string;
  color: string;
}

export function GoalForm({
  accounts,
  editing,
  onSaved,
  onDiscard,
}: {
  accounts: AccountOption[];
  editing?: EditableGoal;
  onSaved: () => void;
  onDiscard?: () => void;
}) {
  const isEditing = !!editing;
  const [name, setName] = useState(editing?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(editing ? String(editing.targetAmount / 100) : "");
  const [targetDate, setTargetDate] = useState(editing?.targetDate ? format(editing.targetDate, "yyyy-MM-dd") : "");
  const [accountId, setAccountId] = useState(editing?.accountId ?? NO_ACCOUNT);
  const [icon, setIcon] = useState(editing?.icon ?? "target");
  const [color, setColor] = useState<SwatchId>((editing?.color as SwatchId) ?? "indigo");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      name,
      targetAmount: Number(targetAmount),
      targetDate: targetDate ? new Date(targetDate) : null,
      accountId: accountId === NO_ACCOUNT ? null : accountId,
      icon,
      color,
    };

    const parsed = goalSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const result = isEditing ? await updateGoalAction(editing.id, parsed.data) : await createGoalAction(parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEditing ? "Goal updated" : "Goal created");
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <IconColorPicker icon={icon} color={color} onChange={(v) => { setIcon(v.icon); setColor(v.color as SwatchId); }} />
        <div className="flex-1">
          <Label htmlFor="goal-name">Goal name</Label>
          <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund" error={!!errors.name} />
          <FieldError>{errors.name}</FieldError>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="goal-target">Target amount</Label>
          <Input
            id="goal-target"
            inputMode="decimal"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            error={!!errors.targetAmount}
          />
          <FieldError>{errors.targetAmount}</FieldError>
        </div>
        <div>
          <Label htmlFor="goal-date">Target date (optional)</Label>
          <DatePicker value={targetDate} onChange={setTargetDate} />
        </div>
      </div>

      <div>
        <Label>Linked account (optional)</Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_ACCOUNT}>None — track manually</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1.5 text-[0.8125rem] text-text-secondary">
          Contributions to a linked account create a real transaction debiting it.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isEditing && onDiscard && (
          <Button type="button" variant="outline" onClick={onDiscard} disabled={isSubmitting}>
            Discard
          </Button>
        )}
        <Button type="submit" className="flex-1" loading={isSubmitting} loadingText="Saving…">
          {isEditing ? "Save changes" : "Create goal"}
        </Button>
      </div>
    </form>
  );
}
