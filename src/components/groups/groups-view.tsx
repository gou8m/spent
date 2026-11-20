"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Users } from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";
import { PartyTabs } from "@/components/people/party-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { GradientTile } from "@/components/ui/initial-avatar";
import { NewGroupSheet } from "@/components/groups/new-group-sheet";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { GroupListItem } from "@/lib/data/split";

function GroupCard({ group, onOpen }: { group: GroupListItem; onOpen: () => void }) {
  const owed = group.youNet > 0;
  const owe = group.youNet < 0;
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3.5 rounded-[22px] bg-surface-2 px-4 py-3.5 text-left transition-colors hover:bg-surface-3 active:scale-[0.99]">
      <GradientTile size="lg">
        <Users size={24} strokeWidth={2} />
      </GradientTile>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-bold text-text-primary">{group.name}</span>
        <span className="mt-0.5 block truncate text-[0.8125rem] text-text-secondary">{group.memberNames.join(", ")}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[0.6875rem] font-semibold text-text-secondary">{owed ? "You are owed" : owe ? "You owe" : group.expenseCount > 0 ? "Settled up" : "No expenses"}</span>
        {(owed || owe) && <span className={cn("block text-[0.9375rem] font-extrabold", owed ? "text-income" : "text-expense")}>{formatMoney(Math.abs(group.youNet), group.currency)}</span>}
      </span>
      <ChevronRight size={18} className="shrink-0 text-text-secondary" />
    </button>
  );
}

export function GroupsView({ groups, currency }: { groups: GroupListItem[]; currency: string }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const live = groups.filter((g) => !g.archived);
  const archived = groups.filter((g) => g.archived);

  function openNew() {
    setFormKey((k) => k + 1);
    setCreating(true);
  }
  const open = (g: GroupListItem) => router.push(`/groups/${g.id}`);
  // The first few groups are fetched ahead of the tap, so a group opens straight away.
  useEffect(() => {
    for (const g of groups.slice(0, 6)) router.prefetch(`/groups/${g.id}`);
  }, [groups, router]);

  return (
    <div className="space-y-4">
      <BackHeader desktopRoot href="/dashboard" title="Transactions" />

      <PartyTabs current="groups" />

      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Split a trip, a flat or a dinner. Only names are needed."
          action={
            <Button type="button" onClick={openNew}>
              <Plus size={18} strokeWidth={2.25} />
              New group
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-2.5">
            {live.map((g, i) => (
              <div key={g.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <GroupCard group={g} onOpen={() => open(g)} />
              </div>
            ))}
          </div>
          {archived.length > 0 && (
            <section>
              <h2 className="mb-2.5 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Archived</h2>
              <div className="flex flex-col gap-2.5">
                {archived.map((g) => (
                  <GroupCard key={g.id} group={g} onOpen={() => open(g)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {groups.length > 0 && (
        <button type="button" onClick={openNew} className="flex w-full items-center gap-3 rounded-[22px] border-2 border-dashed border-border-strong p-4 text-left transition-colors hover:bg-surface-2">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface-2 text-accent-hover">
            <Plus size={22} strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-extrabold text-text-primary">New group</span>
            <span className="block text-xs font-medium text-text-secondary">Names only. Nobody has to install anything.</span>
          </span>
        </button>
      )}

      <NewGroupSheet open={creating} onOpenChange={setCreating} currency={currency} formKey={formKey} />
    </div>
  );
}
