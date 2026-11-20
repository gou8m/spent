"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ExpenseForm } from "@/components/groups/expense-sheet";
import { getSplitContextAction } from "@/actions/split";
import { useSplitSheet } from "@/stores/ui-store";
import type { GroupDetail } from "@/lib/data/split";

type Context = { transaction: { id: string; title: string; amount: number; date: Date; currency: string }; groups: GroupDetail[] };

/** "Split with a group" for an expense you already saved: pick the group and how to divide it. Mounted once for the whole app. */
export function SplitTransactionSheet() {
  const router = useRouter();
  const transactionId = useSplitSheet((s) => s.transactionId);
  const close = useSplitSheet((s) => s.close);
  const [loaded, setLoaded] = useState<{ id: string; context: Context | null; error?: string } | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);

  // Load what the sheet needs each time it is asked for a (new) transaction.
  useEffect(() => {
    if (!transactionId) return;
    let cancelled = false;
    getSplitContextAction(transactionId).then((res) => {
      if (cancelled) return;
      if ("error" in res) setLoaded({ id: transactionId, context: null, error: res.error });
      else {
        setLoaded({ id: transactionId, context: res });
        setGroupId(res.groups[0]?.id ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  const ready = loaded && loaded.id === transactionId ? loaded : null;
  const context = ready?.context ?? null;
  const group = context?.groups.find((g) => g.id === groupId) ?? null;

  return (
    <Sheet open={!!transactionId} onOpenChange={(o) => !o && close()} title="Split with a group" fill>
      {!ready ? (
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm font-semibold text-text-secondary">Loading…</div>
      ) : !context ? (
        <p className="px-6 py-8 text-center text-sm font-semibold text-text-secondary">{ready.error}</p>
      ) : context.groups.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-subtle text-accent-hover">
            <Users size={30} strokeWidth={1.75} />
          </span>
          <p className="text-sm font-semibold text-text-secondary">You have no group in {context.transaction.currency} yet.</p>
          <Button
            type="button"
            onClick={() => {
              close();
              router.push("/groups");
            }}
          >
            Create a group
          </Button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {context.groups.length > 1 && (
            <div className="flex shrink-0 gap-2 overflow-x-auto px-6 pb-1 pt-2">
              {context.groups.map((g) => (
                <Chip key={g.id} selected={g.id === groupId} onClick={() => setGroupId(g.id)}>
                  {g.name}
                </Chip>
              ))}
            </div>
          )}
          {group && (
            <ExpenseForm
              key={`${context.transaction.id}:${group.id}`}
              group={group}
              expense={null}
              fromTransaction={{ id: context.transaction.id, title: context.transaction.title, amount: context.transaction.amount, date: new Date(context.transaction.date) }}
              accounts={[]}
              categories={[]}
              onClose={close}
              onDone={() => router.refresh()}
            />
          )}
        </div>
      )}
    </Sheet>
  );
}
