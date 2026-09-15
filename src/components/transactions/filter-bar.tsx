"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AccountOption } from "@/components/transactions/account-picker";

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
  { value: "TRANSFER", label: "Transfer" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "UPCOMING", label: "Upcoming" },
];

export function FilterBar({ accounts }: { accounts: AccountOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
      params.delete("page");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== (searchParams.get("q") ?? "")) setParam("q", search || null);
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const type = searchParams.get("type") ?? "all";
  const accountId = searchParams.get("account") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const hasFilters = type !== "all" || accountId !== "all" || status !== "all" || !!search;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions…"
          className="h-11 w-full rounded-full bg-surface-2 pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent-subtle"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={type} onValueChange={(v) => setParam("type", v)}>
          {/* Explicit children (not just SelectValue's own label lookup) so the trigger
              has real accessible text from first paint, not only after Radix's Collection
              finishes registering item labels post-hydration. */}
          <SelectTrigger className="w-36"><SelectValue>{TYPE_OPTIONS.find((o) => o.value === type)?.label}</SelectValue></SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={accountId} onValueChange={(v) => setParam("account", v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All accounts">
              {accountId === "all" ? "All accounts" : accounts.find((a) => a.id === accountId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setParam("status", v)}>
          <SelectTrigger className="w-36"><SelectValue>{STATUS_OPTIONS.find((o) => o.value === status)?.label}</SelectValue></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              router.push(pathname);
            }}
            className={cn(
              "flex h-11 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-3",
            )}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
