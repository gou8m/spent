/**
 * Live rates from Frankfurter (ECB-sourced, free, no API key). Used only to
 * pre-fill the "recipient gets" amount on a cross-currency transfer — the
 * user can always override it, so a failed/slow fetch never blocks the form.
 */
const cache = new Map<string, { rate: number; fetchedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — rates don't move fast enough to warrant refetching per keystroke

export async function getExchangeRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;

  const key = `${from}:${to}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.rate;

  try {
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return cached?.rate ?? null;
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rate = data.rates?.[to];
    if (typeof rate !== "number") return cached?.rate ?? null;

    cache.set(key, { rate, fetchedAt: Date.now() });
    return rate;
  } catch {
    return cached?.rate ?? null;
  }
}
