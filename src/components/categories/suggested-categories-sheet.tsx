"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSuggestedCategoriesAction, addSuggestedCategoriesAction, type SuggestedCategory } from "@/actions/categories";

/** Lists the standard categories the user does not have yet, so one tap adds the ones they
 * want (a subcategory brings its parent along if it is missing). */
export function SuggestedCategoriesSheet({
  open,
  onOpenChange,
  type,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "INCOME" | "EXPENSE";
  onDone: () => void;
}) {
  const [items, setItems] = useState<SuggestedCategory[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getSuggestedCategoriesAction().then((list) => !cancelled && setItems(list));
    return () => {
      cancelled = true;
    };
  }, [open]);

  const visible = (items ?? []).filter((i) => i.type === type);
  const groups = [
    { label: "Main categories", list: visible.filter((i) => !i.parent) },
    { label: "Subcategories", list: visible.filter((i) => i.parent) },
  ].filter((g) => g.list.length > 0);
  const chosen = visible.filter((i) => selected.has(i.key));

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleAdd() {
    setIsAdding(true);
    const result = await addSuggestedCategoriesAction(chosen.map((c) => c.key));
    setIsAdding(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Added ${result.added} categor${result.added === 1 ? "y" : "ies"}`);
    setSelected(new Set());
    setItems(null);
    onOpenChange(false);
    onDone();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Suggested categories">
      <div className="space-y-4">
        <p className="text-sm leading-snug text-text-secondary">Standard {type === "EXPENSE" ? "expense" : "income"} categories you do not have yet. Tap the ones you want.</p>
        {items === null ? (
          <Skeleton className="h-32 w-full rounded-[22px]" />
        ) : visible.length === 0 ? (
          <p className="rounded-[22px] bg-surface-2 px-4 py-6 text-center text-sm text-text-secondary">You already have every suggested category.</p>
        ) : (
          groups.map((g) => (
            <div key={g.label}>
              <p className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">{g.label}</p>
              <div className="flex flex-wrap gap-2">
                {g.list.map((c) => (
                  <Chip key={c.key} selected={selected.has(c.key)} onClick={() => toggle(c.key)}>
                    {c.parent ? `${c.parent} › ${c.name}` : c.name}
                  </Chip>
                ))}
              </div>
            </div>
          ))
        )}
        <Button className="h-13 w-full rounded-[18px] font-bold" disabled={chosen.length === 0} loading={isAdding} loadingText="Adding…" onClick={handleAdd}>
          {chosen.length === 0 ? "Choose categories to add" : `Add ${chosen.length} categor${chosen.length === 1 ? "y" : "ies"}`}
        </Button>
      </div>
    </Sheet>
  );
}
