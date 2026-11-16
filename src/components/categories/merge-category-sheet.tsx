"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { mergeCategoryAction } from "@/actions/categories";

export interface MergeCandidate {
  id: string;
  name: string;
  parentId: string | null;
  parentName?: string;
}

/** "Merge into…": picks the category to fold the source into. Every transaction, recurring
 * rule and budget using the source switches to the target, then the source goes away. */
export function MergeCategorySheet({
  open,
  onOpenChange,
  source,
  candidates,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: { id: string; name: string; hasChildren: boolean } | null;
  candidates: MergeCandidate[];
  onDone: () => void;
}) {
  const [targetId, setTargetId] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  // A parent's subcategories need a top-level home, so only top-level targets are offered for it.
  const options = source ? candidates.filter((c) => c.id !== source.id && (!source.hasChildren || !c.parentId)) : [];
  const target = options.find((c) => c.id === targetId);

  async function handleMerge() {
    if (!source || !target) return;
    setIsMerging(true);
    const result = await mergeCategoryAction(source.id, target.id);
    setIsMerging(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Merged "${source.name}" into "${target.name}"${result.moved ? ` (${result.moved} transaction${result.moved === 1 ? "" : "s"} moved)` : ""}`);
    setTargetId("");
    onOpenChange(false);
    onDone();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) setTargetId(""); onOpenChange(o); }} title="Merge category" stackLevel={1}>
      {source && (
        <div className="space-y-4">
          <p className="text-sm leading-snug text-text-secondary">
            Everything filed under <span className="font-bold text-text-primary">{source.name}</span> (transactions, recurring bills and budgets) moves to the
            category you pick, and <span className="font-bold text-text-primary">{source.name}</span> is removed. This can&apos;t be undone.
          </p>
          <div>
            <Label>Merge into</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {options.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.parentName ? `${c.parentName} › ${c.name}` : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="h-13 w-full rounded-[18px] font-bold" disabled={!target} loading={isMerging} loadingText="Merging…" onClick={handleMerge}>
            {target ? `Merge into ${target.name}` : "Merge"}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
