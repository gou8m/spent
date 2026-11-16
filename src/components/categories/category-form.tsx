"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { categorySchema } from "@/lib/validations/category";
import { createCategoryAction, updateCategoryAction } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { IconColorFields } from "@/components/ui/icon-color-fields";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { SwatchId } from "@/lib/colors";

const CATEGORY_ICONS = ["shopping-cart", "utensils", "car", "home", "zap", "heart-pulse", "gift", "plane", "tv", "briefcase", "wallet", "tag"];
const CATEGORY_COLORS: SwatchId[] = ["emerald", "blue", "amber", "violet", "rose", "teal", "slate"];

export interface EditableCategory {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  parentId?: string | null;
}

/** The minimal shape CategoryForm needs from every one of the user's categories (both
 * types, so switching the Type control can re-filter without a re-fetch) to compute
 * which ones are valid "Subcategory of" choices. */
export interface CategoryParentCandidate {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  parentId: string | null;
}

export function CategoryForm({
  editing,
  defaultType = "EXPENSE",
  allCategories,
  onSaved,
}: {
  editing?: EditableCategory;
  defaultType?: "INCOME" | "EXPENSE";
  allCategories: CategoryParentCandidate[];
  onSaved: () => void;
}) {
  const isEditing = !!editing;
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState<"INCOME" | "EXPENSE">(editing?.type ?? defaultType);
  const [icon, setIcon] = useState(editing?.icon ?? "tag");
  const [color, setColor] = useState<SwatchId>((editing?.color as SwatchId) ?? "slate");
  const [parentId, setParentId] = useState(editing?.parentId ?? "");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A category that already has its own subcategories can't be nested under another
  // one (depth is capped at one level) — the "Subcategory of" field is hidden for it
  // rather than offered and then rejected on submit.
  const editingHasChildren = !!editing && allCategories.some((c) => c.parentId === editing.id);
  const parentOptions = allCategories.filter((c) => c.type === type && !c.parentId && c.id !== editing?.id);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    const payload = { name, type, icon, color, parentId: parentId || undefined };
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
      <SegmentedControl
        value={type}
        onChange={(v) => {
          setType(v);
          setParentId("");
        }}
        options={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
        ]}
      />

      <div>
        <Label htmlFor="cat-name">Name</Label>
        <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Groceries" />
      </div>

      {editingHasChildren ? (
        <p className="text-xs text-text-muted">This category has its own subcategories, so it can&apos;t be nested under another.</p>
      ) : (
        parentOptions.length > 0 && (
          <div>
            <Label>Parent category</Label>
            <Select value={parentId || "none"} onValueChange={(v) => setParentId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top level)</SelectItem>
                {parentOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      )}

      <IconColorFields
        icon={icon}
        color={color}
        icons={CATEGORY_ICONS}
        colors={CATEGORY_COLORS}
        onChange={(v) => {
          setIcon(v.icon);
          setColor(v.color);
        }}
      />

      <FieldError>{error}</FieldError>

      <Button type="submit" className="w-full" loading={isSubmitting} loadingText="Saving…">
        {isEditing ? "Save changes" : "Add category"}
      </Button>
    </form>
  );
}
