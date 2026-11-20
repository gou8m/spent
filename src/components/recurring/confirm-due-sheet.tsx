"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Reveal } from "@/components/ui/reveal";
import { confirmRecurringOccurrenceAction } from "@/actions/recurring";
import { useAmountField } from "@/hooks/use-amount-field";
import { decimalsForCurrency, formatMoney } from "@/lib/money";
import type { DueConfirmation } from "@/lib/data/recurring";

const subscribe = () => () => {};
const dismissKey = () => `confirm-due-dismissed:${format(new Date(), "yyyy-MM-dd")}`;

/**
 * On the due date of an "ask me each time" recurring item (rent that now and then changes, a salary that varies),
 * a prompt appears when the app opens: confirm the usual amount, or change it. One item at a time. "Later" hides
 * it for today; the item stays pending and the bell still reminds.
 */
export function ConfirmDueSheet({ items }: { items: DueConfirmation[] }) {
  const router = useRouter();
  const dismissedToday = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return sessionStorage.getItem(dismissKey()) === "1";
      } catch {
        return false;
      }
    },
    () => true,
  );
  const [hidden, setHidden] = useState(false);
  const [changing, setChanging] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const current = items[0];
  const currency = current?.currency ?? "USD";
  const { attach, value: amountText, onChange } = useAmountField(amount, setAmount, currency);

  function later() {
    try {
      sessionStorage.setItem(dismissKey(), "1");
    } catch {
      // Not remembered when storage is blocked; it comes back on the next visit.
    }
    setHidden(true);
  }

  async function finish(newAmount?: number) {
    if (!current) return;
    setBusy(true);
    setError(null);
    const result = await confirmRecurringOccurrenceAction(current.id, newAmount);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(newAmount === undefined ? `${current.title} confirmed` : `${current.title} saved`);
    setChanging(false);
    setAmount("");
    router.refresh();
  }

  if (!current) return null;
  const open = !dismissedToday && !hidden;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && later()} title="Recurring due" hideHeader>
      <div className="flex flex-col items-center px-1 pb-1 pt-1 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-accent text-text-on-accent">
          <CalendarClock size={30} strokeWidth={2} />
        </span>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-text-secondary">
          {current.type === "INCOME" ? "Expected today" : "Due"} · {format(new Date(current.date), "d MMM")}
        </p>
        <h2 className="mt-1 text-[1.5rem] font-extrabold tracking-tight text-text-primary">{current.title}</h2>
        <p className="mt-1 font-numeric text-[2.25rem] font-extrabold tracking-tight text-text-primary">{formatMoney(current.amount, current.currency)}</p>
        <p className="mt-1 text-sm text-text-secondary">{current.accountName}</p>

        <Reveal show={changing} gap={false}>
          {() => (
            <div className="mt-4 w-full text-left">
              <Label htmlFor="due-amount">What was it this time?</Label>
              <Input
                id="due-amount"
                inputMode="decimal"
                placeholder={(current.amount / 10 ** decimalsForCurrency(currency)).toFixed(decimalsForCurrency(currency))}
                ref={attach}
                value={amountText}
                onChange={onChange}
                error={!!error}
              />
              <FieldError>{error}</FieldError>
            </div>
          )}
        </Reveal>
        {!changing && error && <p className="mt-2 text-xs font-bold text-error">{error}</p>}

        <div className="mt-5 grid w-full grid-cols-2 gap-3">
          {changing ? (
            <>
              <Button variant="secondary" size="lg" onClick={() => setChanging(false)} disabled={busy}>
                Back
              </Button>
              <Button size="lg" onClick={() => finish(Number(amount))} disabled={!amount || Number(amount) <= 0} loading={busy} loadingText="Saving…">
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="lg" onClick={() => setChanging(true)} disabled={busy}>
                Change
              </Button>
              <Button size="lg" onClick={() => finish()} loading={busy} loadingText="Saving…">
                Confirm
              </Button>
            </>
          )}
        </div>
        <button type="button" onClick={later} className="mt-3 text-sm font-semibold text-text-secondary hover:text-text-primary">
          Later{items.length > 1 ? ` (${items.length} waiting)` : ""}
        </button>
      </div>
    </Sheet>
  );
}
