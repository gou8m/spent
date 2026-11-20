import { getExchangeRate } from "@/lib/exchange-rates";

/** Today's rate into the main currency for every currency these loans are in (the main currency itself is left out). */
export async function getLoanRates(loans: { currency: string }[], primary: string): Promise<Record<string, number>> {
  const currencies = [...new Set(loans.map((l) => l.currency))].filter((c) => c !== primary);
  const entries = await Promise.all(currencies.map(async (c) => [c, await getExchangeRate(c, primary)] as const));
  const rates: Record<string, number> = {};
  for (const [c, rate] of entries) if (rate) rates[c] = rate;
  return rates;
}
