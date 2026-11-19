import { create } from "zustand";
import { useEffect, useMemo } from "react";
import type { TransactionWithRelations } from "@/lib/data/transactions";

/**
 * What the lists show the instant a transaction is saved, edited or deleted, before the server has sent
 * the refreshed page back (that can take a second or two). Entries are dropped as soon as the real data
 * contains them, and in any case after a minute.
 */
const MAX_AGE_MS = 60_000;

interface Entry {
  tx: TransactionWithRelations;
  at: number;
}

interface State {
  added: Record<string, Entry>;
  edited: Record<string, Entry>;
  deleted: Record<string, number>;
  add: (tx: TransactionWithRelations) => void;
  edit: (tx: TransactionWithRelations) => void;
  remove: (id: string) => void;
  prune: (seenIds: Set<string>, now: number) => void;
}

export const useOptimisticTransactions = create<State>((set) => ({
  added: {},
  edited: {},
  deleted: {},
  add: (tx) => set((s) => ({ added: { ...s.added, [tx.id]: { tx, at: Date.now() } } })),
  edit: (tx) => set((s) => ({ edited: { ...s.edited, [tx.id]: { tx, at: Date.now() } } })),
  remove: (id) => set((s) => ({ deleted: { ...s.deleted, [id]: Date.now() } })),
  prune: (seenIds, now) =>
    set((s) => {
      const fresh = <T extends { at: number }>(rec: Record<string, T>, keep: (id: string) => boolean) =>
        Object.fromEntries(Object.entries(rec).filter(([id, e]) => now - e.at < MAX_AGE_MS && keep(id)));
      const next = {
        // The real list has a new one now: nothing left to pretend.
        added: fresh(s.added, (id) => !seenIds.has(id)),
        // An edit is replaced by the server's copy at merge time; it just ages out here.
        edited: fresh(s.edited, () => true),
        // A deleted one is hidden for as long as the real list still contains it.
        deleted: Object.fromEntries(Object.entries(s.deleted).filter(([id, at]) => now - at < MAX_AGE_MS && seenIds.has(id))),
      };
      const same = (a: object, b: object) => Object.keys(a).length === Object.keys(b).length;
      return same(next.added, s.added) && same(next.edited, s.edited) && same(next.deleted, s.deleted) ? s : next;
    }),
}));

/**
 * The list as the person expects to see it right now: a deleted one gone, an edited one updated, and a
 * new one at the top (new ones are only added when `includeAdded` is true, i.e. no filter could hide them).
 */
export function useMergedTransactions(server: TransactionWithRelations[], options: { includeAdded: boolean; onlyCompleted?: boolean; limit?: number }) {
  const { added, edited, deleted, prune } = useOptimisticTransactions();
  const { includeAdded, onlyCompleted, limit } = options;

  const merged = useMemo(() => {
    let list = server.filter((t) => !(t.id in deleted)).map((t) => {
      const e = edited[t.id];
      // An edit stays on screen until the server's copy is newer than it.
      return e && new Date(t.updatedAt).getTime() < e.at - 1500 ? e.tx : t;
    });
    if (includeAdded) {
      const known = new Set(list.map((t) => t.id));
      const extra = Object.values(added)
        .map((e) => e.tx)
        .filter((t) => !known.has(t.id) && !(t.id in deleted) && (!onlyCompleted || t.status === "COMPLETED"));
      if (extra.length > 0) {
        list = [...extra, ...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }
    return limit ? list.slice(0, limit) : list;
  }, [server, added, edited, deleted, includeAdded, onlyCompleted, limit]);

  // Once the server's own list has caught up, forget what was only pretend.
  useEffect(() => {
    const seen = new Set(server.map((t) => t.id));
    const stale = Object.keys(added).some((id) => seen.has(id)) || Object.keys(deleted).some((id) => !seen.has(id));
    const timer = setTimeout(() => prune(seen, Date.now()), stale ? 0 : MAX_AGE_MS);
    return () => clearTimeout(timer);
  }, [server, added, deleted, prune]);

  return merged;
}
