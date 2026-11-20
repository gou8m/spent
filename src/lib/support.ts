import { MAX_MINOR_UNITS, toMinorUnits } from "@/lib/money";

/**
 * "Support the developer": the amounts offered per currency, and the limits a tip must stay within.
 * Pure, so the form and the server check the same rules.
 */

/** Three suggested tips (major units) for each currency; the rest of the world gets 1, 5, 10. */
const PRESETS: Record<string, [number, number, number]> = {
  INR: [25, 50, 100],
  JPY: [100, 500, 1000],
  KRW: [1000, 5000, 10000],
  AED: [5, 20, 40],
  CNY: [5, 20, 50],
  MXN: [20, 100, 200],
  BRL: [5, 25, 50],
  ZAR: [20, 90, 180],
};

export function supportPresets(currency: string): [number, number, number] {
  return PRESETS[currency] ?? [1, 5, 10];
}

const MINIMUM: Record<string, number> = { JPY: 100, KRW: 1000 };

/** The smallest and largest tip, in major units. */
export function supportLimits(currency: string): { min: number; max: number } {
  return { min: MINIMUM[currency] ?? 1, max: supportPresets(currency)[2] * 500 };
}

/** Why a tip is not acceptable, or null when it is. `major` is what was typed or tapped. */
export function checkSupportAmount(major: number, currency: string): string | null {
  if (!Number.isFinite(major) || major <= 0) return "Enter an amount";
  const { min, max } = supportLimits(currency);
  if (major < min) return `The smallest tip is ${min}`;
  if (major > max) return `The largest tip is ${max}`;
  const minor = toMinorUnits(major, currency);
  if (!Number.isInteger(minor) || minor <= 0 || minor > MAX_MINOR_UNITS) return "Enter a valid amount";
  return null;
}
