"use client";

import { useState } from "react";
import { Tag as TagIcon, X } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { upsertTagAction } from "@/actions/transactions";

export interface TagOption {
  id: string;
  name: string;
}

export function TagInput({
  tags,
  selected,
  onChange,
}: {
  /** The user's existing tags, for picking one that already exists without retyping it. */
  tags: TagOption[];
  selected: TagOption[];
  onChange: (tags: TagOption[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const unselected = tags.filter((t) => !selected.some((s) => s.id === t.id));

  async function commit() {
    const name = draft.trim();
    setDraft("");
    setAdding(false);
    if (!name) return;

    const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!selected.some((s) => s.id === existing.id)) onChange([...selected, existing]);
      return;
    }

    const result = await upsertTagAction(name);
    if (result.tag) onChange([...selected, result.tag]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selected.map((tag) => (
        <Chip key={tag.id} selected icon={<TagIcon size={14} strokeWidth={2} />} onClick={() => onChange(selected.filter((t) => t.id !== tag.id))}>
          {tag.name}
          <X size={13} strokeWidth={2.5} />
        </Chip>
      ))}

      {unselected.map((tag) => (
        <Chip key={tag.id} onClick={() => onChange([...selected, tag])}>
          {tag.name}
        </Chip>
      ))}

      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          placeholder="Tag name"
          className="h-10 w-28 rounded-full border-2 border-accent-border bg-transparent px-3.5 text-sm font-semibold text-text-primary outline-none"
        />
      ) : (
        <Chip dashed onClick={() => setAdding(true)}>
          Add tag
        </Chip>
      )}
    </div>
  );
}
