"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tags, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { IconChip } from "@/components/ui/icon-chip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CategoryForm, type EditableCategory } from "@/components/categories/category-form";
import { deleteCategoryAction } from "@/actions/categories";
import type { getCategories } from "@/lib/data/categories";

type CategoryRecord = Awaited<ReturnType<typeof getCategories>>[number];

export function CategoriesView({ categories }: { categories: CategoryRecord[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState<"EXPENSE" | "INCOME">(
    searchParams.get("type") === "INCOME" ? "INCOME" : "EXPENSE",
  );
  // Arriving from the "Custom" button in a category picker (?add=1&type=...) jumps
  // straight into the add-category sheet instead of making the user find the button.
  // That picker lives inside the global Add Transaction sheet, which this navigation
  // doesn't close (its open state lives outside this page) — so this sheet can open
  // while that one is still open underneath; stackLevel keeps this one's own dimming
  // overlay from rendering invisibly behind the still-open transaction sheet's content.
  const [openedFromPicker] = useState(() => searchParams.get("add") === "1");
  const [sheetOpen, setSheetOpen] = useState(openedFromPicker);
  const [editing, setEditing] = useState<EditableCategory | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      router.replace("/profile/categories", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only meant to fire once, off the initial query string
  }, []);

  const filtered = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string, CategoryRecord[]>();
    for (const c of filtered) {
      if (!c.parentId) continue;
      if (!map.has(c.parentId)) map.set(c.parentId, []);
      map.get(c.parentId)!.push(c);
    }
    return map;
  }, [filtered]);
  const topLevel = useMemo(() => filtered.filter((c) => !c.parentId), [filtered]);
  const parentCandidates = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name, type: c.type as "INCOME" | "EXPENSE", parentId: c.parentId })),
    [categories],
  );

  function openAdd() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function openEdit(category: CategoryRecord) {
    setEditing({
      id: category.id,
      name: category.name,
      type: category.type as "INCOME" | "EXPENSE",
      icon: category.icon,
      color: category.color,
      parentId: category.parentId,
    });
    setSheetOpen(true);
  }

  async function handleDelete(category: CategoryRecord) {
    if (!confirm(`Delete "${category.name}"?`)) return;
    setDeletingId(category.id);
    const result = await deleteCategoryAction(category.id);
    setDeletingId(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.archived ? "Category archived (it's in use)" : "Category deleted");
      router.refresh();
    }
  }

  function renderRow(category: CategoryRecord, indented: boolean) {
    return (
      <li key={category.id} className={`flex items-center gap-3 px-4 py-3 ${indented ? "pl-9" : ""}`}>
        <IconChip icon={category.icon} color={category.color} size="sm" />
        <span className="flex-1 text-sm font-medium text-text-primary">
          {category.name}
          {category.isArchived && <span className="ml-2 text-xs font-normal text-text-muted">Archived</span>}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={deletingId === category.id}
              aria-label={`${category.name} options`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-2 hover:text-text-primary disabled:opacity-50"
            >
              {deletingId === category.id ? <Loader2 size={15} className="animate-spin" /> : <Pencil size={15} />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => openEdit(category)}>
              <Pencil size={14} /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem destructive onClick={() => handleDelete(category)}>
              <Trash2 size={14} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Categories</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus size={16} strokeWidth={2.5} />
          Add category
        </Button>
      </div>

      <SegmentedControl
        value={type}
        onChange={setType}
        className="max-w-xs"
        options={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Tags} title="No categories yet" description="Add a category to start organizing your transactions." />
      ) : (
        <ul className="divide-y divide-divider rounded-3xl bg-surface shadow-sm">
          {topLevel.map((category) => [
            renderRow(category, false),
            ...(childrenByParent.get(category.id) ?? []).map((child) => renderRow(child, true)),
          ])}
        </ul>
      )}

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit category" : "Add category"}
        stackLevel={openedFromPicker ? 1 : 0}
      >
        <CategoryForm
          editing={editing}
          defaultType={type}
          allCategories={parentCandidates}
          onSaved={() => {
            setSheetOpen(false);
            router.refresh();
          }}
        />
      </Sheet>
    </div>
  );
}
