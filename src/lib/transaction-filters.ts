import { startOfMonth, endOfMonth, subDays, startOfDay, endOfDay, subMonths } from "date-fns";
import { toMinorUnits } from "@/lib/money";
import type { TransactionFilters } from "@/lib/data/transactions";

export interface FilterState {
  accountId: string | null;
  categoryId: string | null;
  tagId: string | null;
  datePreset: "all" | "this-month" | "last-30" | "last-month" | "custom";
  dateFrom: string | null;
  dateTo: string | null;
  amountMin: string;
  amountMax: string;
}

export const EMPTY_FILTER_STATE: FilterState = {
  accountId: null,
  categoryId: null,
  tagId: null,
  datePreset: "all",
  dateFrom: null,
  dateTo: null,
  amountMin: "",
  amountMax: "",
};

function presetToRange(preset: FilterState["datePreset"], now = new Date()): { from?: Date; to?: Date } {
  if (preset === "this-month") return { from: startOfMonth(now), to: endOfMonth(now) };
  if (preset === "last-30") return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
  if (preset === "last-month") {
    const last = subMonths(now, 1);
    return { from: startOfMonth(last), to: endOfMonth(last) };
  }
  return {};
}

export function toBaseFilters(state: FilterState, type: string, search: string, currency: string): TransactionFilters {
  const range = state.datePreset === "custom" ? {} : presetToRange(state.datePreset);
  return {
    type: type === "all" ? undefined : (type as TransactionFilters["type"]),
    search: search || undefined,
    searchCurrency: currency,
    accountId: state.accountId ?? undefined,
    categoryId: state.categoryId ?? undefined,
    tagId: state.tagId ?? undefined,
    dateFrom: state.datePreset === "custom" ? (state.dateFrom ? new Date(state.dateFrom) : undefined) : range.from,
    dateTo: state.datePreset === "custom" ? (state.dateTo ? new Date(state.dateTo) : undefined) : range.to,
    amountMin: state.amountMin ? toMinorUnits(Number(state.amountMin), currency) : undefined,
    amountMax: state.amountMax ? toMinorUnits(Number(state.amountMax), currency) : undefined,
  };
}

export function activeFilterCount(state: FilterState): number {
  let count = 0;
  if (state.accountId) count++;
  if (state.categoryId) count++;
  if (state.tagId) count++;
  if (state.datePreset !== "all") count++;
  if (state.amountMin || state.amountMax) count++;
  return count;
}
