"use server";

import { requireUserId } from "@/lib/auth-helpers";
import { getExchangeRate } from "@/lib/exchange-rates";

/** Live rate, from `from` to `to` — used only to pre-fill the destination
 * amount on a cross-currency transfer; the user can always override it. */
export async function getExchangeRateAction(from: string, to: string): Promise<number | null> {
  await requireUserId();
  return getExchangeRate(from, to);
}
