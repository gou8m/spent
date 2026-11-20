"use client";

import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowRight, HandCoins } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { DatePicker } from "@/components/ui/date-picker";
import { createSettlementAction } from "@/actions/split";
import { useAmountField } from "@/hooks/use-amount-field";
import { decimalsForCurrency } from "@/lib/money";
import type { GroupDetail } from "@/lib/data/split";

export interface SettlePrefill {
  from: string;
  to: string;
  /** Minor units. */
  amount: number;
}

/** Records that one member paid another. It lowers what they owe in the group; no account of yours moves. */
export function SettleSheet({
  open,
  onOpenChange,
  formKey,
  group,
  prefill,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formKey: number;
  group: GroupDetail;
  prefill: SettlePrefill | null;
  onDone: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Settle up">
      <SettleForm key={`${formKey}:${prefill ? `${prefill.from}:${prefill.to}` : "new"}`} group={group} prefill={prefill} onClose={() => onOpenChange(false)} onDone={onDone} />
    </Sheet>
  );
}

function SettleForm({ group, prefill, onClose, onDone }: { group: GroupDetail; prefill: SettlePrefill | null; onClose: () => void; onDone: () => void }) {
  const active = group.members.filter((m) => !m.removed);
  const [from, setFrom] = useState(prefill?.from ?? "");
  const [to, setTo] = useState(prefill?.to ?? "");
  const [amount, setAmount] = useState(prefill ? String(prefill.amount / 10 ** decimalsForCurrency(group.currency)) : "");
  const { attach, value: amountText, onChange: onAmountChange } = useAmountField(amount, setAmount, group.currency);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!from || !to) return setError("Choose who paid and who got paid");
    if (from === to) return setError("Choose two different people");
    if (!(Number(amount) > 0)) return setError("Enter an amount above 0");
    setSaving(true);
    const res = await createSettlementAction({ groupId: group.id, fromMemberId: from, toMemberId: to, amount: Number(amount), date: new Date(date), note: note.trim() || undefined });
    setSaving(false);
    if (res.error) return setError(res.error);
    toast.success("Payment recorded");
    onClose();
    onDone();
  }

  const picker = (label: string, value: string, set: (id: string) => void, other: string) => (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {active.map((m) => (
          <Chip key={m.id} selected={value === m.id} disabled={other === m.id} className={other === m.id ? "opacity-40" : undefined} onClick={() => set(m.id)}>
            {m.name}
          </Chip>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4 pb-6 pt-2">
      {picker("Who paid", from, setFrom, to)}
      <div className="flex justify-center text-text-secondary">
        <ArrowRight size={18} className="rotate-90" />
      </div>
      {picker("Who got it", to, setTo, from)}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="settle-amount">Amount ({group.currency})</Label>
          <Input id="settle-amount" inputMode="decimal" placeholder="0.00" ref={attach} value={amountText} onChange={onAmountChange} />
        </div>
        <div>
          <Label>Date</Label>
          <DatePicker value={date} onChange={setDate} />
        </div>
      </div>
      <div>
        <Label htmlFor="settle-note">Note (optional)</Label>
        <Input id="settle-note" placeholder="e.g. UPI" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" size="lg" className="w-full" loading={saving} loadingText="Saving…">
        <HandCoins size={18} strokeWidth={2} />
        Record payment
      </Button>
    </form>
  );
}
