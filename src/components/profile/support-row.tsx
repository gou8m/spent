"use client";

import { useState } from "react";
import { Heart, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/ui/reveal";
import { useAmountField } from "@/hooks/use-amount-field";
import { createSupportOrderAction, verifySupportPaymentAction } from "@/actions/support";
import { checkSupportAmount, supportPresets } from "@/lib/support";
import { formatMoney, toMinorUnits } from "@/lib/money";
import { CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error?: { description?: string } }) => void) => void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let scriptPromise: Promise<boolean> | null = null;
/** Loads Razorpay's checkout script once, on first use. */
function loadCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  scriptPromise ??= new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

type Snapshot = { choice: number | "custom"; custom: string };

/**
 * "Support the developer": a settings row that opens a small sheet of tip amounts and pays through Razorpay.
 * The sheet is a modal that blocks touches outside itself, and Razorpay's window lives outside it, so the sheet is
 * put away while the payment window is open and comes back afterwards (with what you had chosen, or a thank-you).
 */
export function SupportRow({ currency, name, email }: { currency: string; name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [thanks, setThanks] = useState<number | null>(null);
  const [saved, setSaved] = useState<Snapshot | null>(null);

  function show() {
    setOpen(true);
    setFormKey((k) => k + 1);
  }

  async function pay(amount: number, snapshot: Snapshot) {
    setBusy(true);
    const order = await createSupportOrderAction(amount, currency);
    if (!("orderId" in order)) {
      setBusy(false);
      toast.error(order.error);
      return;
    }
    if (!(await loadCheckout()) || !window.Razorpay) {
      setBusy(false);
      toast.error("Could not open the payment window. Check your connection.");
      return;
    }
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#1b6b33";
    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "Spent.",
      description: "Support the developer",
      prefill: { name, email },
      theme: { color: accent },
      handler: async (response: RazorpaySuccess) => {
        const check = await verifySupportPaymentAction({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature });
        setBusy(false);
        if (!check.ok) {
          toast.error(check.error ?? "We could not confirm that payment");
          setSaved(snapshot);
          show();
          return;
        }
        setThanks(order.amount);
        show();
      },
      modal: {
        ondismiss: () => {
          setBusy(false);
          setSaved(snapshot);
          show();
        },
      },
    });
    checkout.on("payment.failed", (response) => toast.error(response.error?.description ?? "The payment did not go through"));
    // Put the sheet away first so it stops catching touches, then open Razorpay's window.
    setOpen(false);
    window.setTimeout(() => checkout.open(), 320);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setThanks(null);
          setSaved(null);
          show();
        }}
        className="flex h-13 w-full items-center gap-3.5 px-4 text-left hover:bg-surface-3"
      >
        <Heart size={22} strokeWidth={2} className="shrink-0 text-accent-text" />
        <span className="flex-1 text-base font-semibold text-text-primary">Support the developer</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="Support the developer">
        <SupportForm key={formKey} currency={currency} initial={saved} busy={busy} thanks={thanks} onPay={pay} onClose={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

function SupportForm({
  currency,
  initial,
  busy,
  thanks,
  onPay,
  onClose,
}: {
  currency: string;
  initial: Snapshot | null;
  busy: boolean;
  thanks: number | null;
  onPay: (amount: number, snapshot: Snapshot) => void;
  onClose: () => void;
}) {
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
  const presets = supportPresets(currency);
  const [choice, setChoice] = useState<number | "custom">(initial?.choice ?? presets[1]);
  const [custom, setCustom] = useState(initial?.custom ?? "");
  const { attach, value: customText, onChange: onCustomChange } = useAmountField(custom, setCustom, currency);

  const isCustom = choice === "custom";
  const amount = isCustom ? Number(custom) : choice;
  const typed = isCustom ? custom !== "" && Number(custom) > 0 : true;
  const problem = typed ? checkSupportAmount(amount, currency) : null;

  if (thanks !== null) {
    return (
      <div className="animate-fade-in flex flex-col items-center pb-2 pt-4 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-accent-subtle text-accent-hover">
          <Heart size={38} strokeWidth={1.75} />
        </span>
        <p className="mt-5 text-[1.5rem] font-extrabold tracking-tight text-text-primary">Thank you</p>
        <p className="mt-1.5 text-[0.9375rem] font-semibold text-text-secondary">Your {formatMoney(thanks, currency, undefined, thanks % 100 === 0 ? { decimals: 0 } : undefined)} reached the developer. It means a lot.</p>
        <Button type="button" size="lg" className="mt-6 w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  const label = typed && !problem ? `Pay ${formatMoney(toMinorUnits(amount, currency), currency, undefined, Number.isInteger(amount) ? { decimals: 0 } : undefined)}` : "Pay";

  return (
    <div className="space-y-4 pb-2">
      <p className="text-sm font-semibold leading-snug text-text-secondary">Spent is free and has no ads. A small tip keeps it going.</p>

      <Reveal show={!isCustom}>
        <div className="grid grid-cols-2 gap-2.5">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={choice === p}
              onClick={() => setChoice(p)}
              className={cn(
                "h-15.5 rounded-[20px] border-2 text-lg font-extrabold transition-[background-color,border-color,transform] active:scale-[0.97]",
                choice === p ? "border-accent bg-accent-subtle text-accent-hover" : "border-transparent bg-surface-2 text-text-primary",
              )}
            >
              {symbol}
              {p.toLocaleString("en-US")}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setChoice("custom")}
            className="h-15.5 rounded-[20px] border-2 border-transparent bg-surface-2 text-lg font-extrabold text-text-primary transition-transform active:scale-[0.97]"
          >
            Custom
          </button>
        </div>
      </Reveal>

      <Reveal show={isCustom}>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-extrabold text-text-secondary">{symbol}</span>
          <Input
            aria-label="Amount"
            inputMode="decimal"
            placeholder="Enter an amount"
            ref={attach}
            value={customText}
            onChange={onCustomChange}
            error={!!problem}
            className="h-14 pl-10 pr-12 text-lg font-bold"
            autoFocus={isCustom}
          />
          <button
            type="button"
            aria-label="Back to amounts"
            onClick={() => {
              setChoice(presets[1]);
              setCustom("");
            }}
            className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface-3 text-text-secondary"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
        {problem && <p className="mt-2 text-xs font-bold text-error">{problem}</p>}
      </Reveal>

      <Button type="button" size="lg" className="w-full" disabled={!typed || !!problem} loading={busy} loadingText="Opening…" onClick={() => onPay(amount, { choice, custom })}>
        {label}
      </Button>
      <p className="text-center text-xs font-semibold text-text-secondary">Secure payment by Razorpay. Nothing about your card is stored by Spent.</p>
    </div>
  );
}
