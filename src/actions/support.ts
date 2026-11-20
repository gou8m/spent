"use server";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { requireUserId } from "@/lib/auth-helpers";
import { withinRateLimit, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit";
import { CURRENCIES } from "@/lib/constants";
import { toMinorUnits } from "@/lib/money";
import { checkSupportAmount } from "@/lib/support";

/**
 * "Support the developer" tips through Razorpay Standard Checkout. Two steps, both on the server:
 * make an order (the amount is decided here, never trusted from the browser's checkout), and check the
 * signature Razorpay sends back after payment. The key secret never leaves the server. Nothing is stored:
 * a tip is a thank-you, not a purchase.
 */

export type SupportResult<T> = ({ error?: undefined } & T) | { error: string };

function credentials() {
  // Pasted values often carry a stray space or line break.
  const id = process.env.RAZORPAY_KEY_ID?.trim();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return id && secret ? { id, secret } : null;
}

export async function createSupportOrderAction(major: number, currency: string): Promise<SupportResult<{ orderId: string; amount: number; currency: string; keyId: string }>> {
  const userId = await requireUserId();
  if (!CURRENCIES.some((c) => c.code === currency)) return { error: "That currency is not available" };
  const problem = checkSupportAmount(major, currency);
  if (problem) return { error: problem };
  const keys = credentials();
  if (!keys) {
    console.error("[support] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set on the server");
    return { error: "Tips are not set up on the server yet" };
  }
  if (!(await withinRateLimit(`support-order:${userId}`, 10, 3600))) return { error: TOO_MANY_ATTEMPTS };

  const amount = toMinorUnits(major, currency);
  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${keys.id}:${keys.secret}`).toString("base64")}` },
      body: JSON.stringify({ amount, currency, receipt: `tip_${randomBytes(6).toString("hex")}`, notes: { purpose: "support the developer" } }),
      cache: "no-store",
    });
    if (res.status === 401) {
      console.error("[support] Razorpay rejected the key id and secret (check both values and that they are from the same mode)");
      return { error: "Razorpay did not accept the keys. Check them in Vercel." };
    }
    if (!res.ok) {
      console.error("[support] Razorpay refused the order:", res.status, await res.text().catch(() => ""));
      return { error: "Could not start the payment. Try again." };
    }
    const order = (await res.json()) as { id?: string; amount?: number; currency?: string };
    if (!order.id) return { error: "Could not start the payment. Try again." };
    return { orderId: order.id, amount: order.amount ?? amount, currency: order.currency ?? currency, keyId: keys.id };
  } catch (error) {
    console.error("[support] could not reach Razorpay:", error);
    return { error: "Could not start the payment. Try again." };
  }
}

/** Checks Razorpay's signature: HMAC-SHA256 of "order_id|payment_id" with the key secret. */
export async function verifySupportPaymentAction(input: { orderId: string; paymentId: string; signature: string }): Promise<{ ok: boolean; error?: string }> {
  await requireUserId();
  const { orderId, paymentId, signature } = input ?? {};
  if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string" || !orderId || !paymentId || !signature) {
    return { ok: false, error: "Missing payment details" };
  }
  const keys = credentials();
  if (!keys) return { ok: false, error: "Tips are not switched on yet" };
  const expected = createHmac("sha256", keys.secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, error: "We could not confirm that payment" };
  return { ok: true };
}
