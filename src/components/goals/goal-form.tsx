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
import { IconColorFields } from "@/components/ui/icon-color-fields";
import type { SwatchId } from "@/lib/colors";

const GOAL_ICONS = ["target", "plane", "laptop", "home", "car-front", "gift", "graduation-cap", "heart", "baby", "bike", "smartphone", "luggage"];
const GOAL_COLORS: SwatchId[] = ["blue", "emerald", "amber", "violet", "rose"];

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
  const [accountId, setAccountId] = useState(editing ? (editing.accountId ?? NO_ACCOUNT) : "");
  const [icon, setIcon] = useState(editing?.icon ?? "target");
  const [color, setColor] = useState<SwatchId>((editing?.color as SwatchId) ?? "blue");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    // New goals must say where the money is kept (or explicitly that it is tracked by hand).
    if (!accountId && accounts.length > 0) {
      setErrors({ accountId: "Choose the account you save this in, or pick the track-it-myself option" });
      return;
    }

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
      <div>
        <Label htmlFor="goal-name">Name</Label>
        <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund" error={!!errors.name} />
        <FieldError>{errors.name}</FieldError>
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
          <Label htmlFor="goal-date">Target date</Label>
          <DatePicker value={targetDate} onChange={setTargetDate} placeholder="Optional" />
        </div>
      </div>

      <div>
        <Label>Saving account</Label>
        <Select value={accountId} onValueChange={(v) => { setAccountId(v); setErrors((prev) => ({ ...prev, accountId: "" })); }}>
          <SelectTrigger><SelectValue placeholder="Which account do you save this in?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_ACCOUNT}>None, I will track it myself</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>{errors.accountId}</FieldError>
        <p className="mt-1.5 text-xs leading-snug text-text-secondary">
          The account this goal&apos;s money sits in. When money arrives there you will be asked if it is for a goal, and spending from that account
          warns you before it touches money set aside for goals.
        </p>
      </div>

      <IconColorFields
        icon={icon}
        color={color}
        icons={GOAL_ICONS}
        colors={GOAL_COLORS}
        onChange={(v) => {
          setIcon(v.icon);
          setColor(v.color);
        }}
      />

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
