"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { categorySchema } from "@/lib/validations/category";
import { createCategoryAction, updateCategoryAction } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { IconColorPicker } from "@/components/ui/icon-color-picker";
import type { SwatchId } from "@/lib/colors";

export interface EditableCategory {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
}

export function CategoryForm({
  editing,
  defaultType = "EXPENSE",
  onSaved,
}: {
  editing?: EditableCategory;
  defaultType?: "INCOME" | "EXPENSE";
  onSaved: () => void;
}) {
  const isEditing = !!editing;
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState<"INCOME" | "EXPENSE">(editing?.type ?? defaultType);
  const [icon, setIcon] = useState(editing?.icon ?? "tag");
  const [color, setColor] = useState<SwatchId>((editing?.color as SwatchId) ?? "slate");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    const payload = { name, type, icon, color };
    const parsed = categorySchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }

    setIsSubmitting(true);
    const result = isEditing
      ? await updateCategoryAction(editing.id, parsed.data)
      : await createCategoryAction(parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEditing ? "Category updated" : "Category added");
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <IconColorPicker icon={icon} color={color} onChange={(v) => { setIcon(v.icon); setColor(v.color as SwatchId); }} />
        <div className="flex-1">
          <Label htmlFor="cat-name">Category name</Label>
          <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Groceries" />
        </div>
      </div>

      <div>
        <Label>Type</Label>
        <SegmentedControl
          value={type}
          onChange={setType}
          options={[
            { value: "EXPENSE", label: "Expense" },
            { value: "INCOME", label: "Income" },
          ]}
        />
      </div>

      <FieldError>{error}</FieldError>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Add category"}
      </Button>
    </form>
  );
}
