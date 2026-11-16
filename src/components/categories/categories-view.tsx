"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tags, Loader2, ChevronDown, MoreHorizontal } from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { IconChip } from "@/components/ui/icon-chip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CategoryForm, type EditableCategory } from "@/components/categories/category-form";
import { deleteCategoryAction } from "@/actions/categories";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { getCategories } from "@/lib/data/categories";

type CategoryRecord = Awaited<ReturnType<typeof getCategories>>[number];

export function CategoriesView({
  categories,
  monthTotals,
  currency,
}: {
  categories: CategoryRecord[];
  monthTotals: Record<string, number>;
  currency: string;
}) {
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
  const [presetParentId, setPresetParentId] = useState<string | undefined>(undefined);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
    setPresetParentId(undefined);
    setSheetOpen(true);
  }

  function openAddSub(parent: CategoryRecord) {
    setEditing(undefined);
    setPresetParentId(parent.id);
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

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function money(minor: number) {
    return formatMoney(minor, currency, undefined, { decimals: 0 });
  }

  function optionsMenu(category: CategoryRecord) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={deletingId === category.id}
            aria-label={`${category.name} options`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-3 disabled:opacity-50"
          >
            {deletingId === category.id ? <Loader2 size={17} className="animate-spin" /> : <MoreHorizontal size={18} />}
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
    );
  }

  function renderCategory(category: CategoryRecord) {
    const children = childrenByParent.get(category.id) ?? [];
    const isOpen = expanded.has(category.id);
    const childSummary =
      children.length === 0 ? "No subcategories" : `${children.length} ${children.length === 1 ? "subcategory" : "subcategories"}`;
    // A parent figure also counts what its subcategories spent, matching how budgets treat a parent.
    const total = (monthTotals[category.id] ?? 0) + children.reduce((sum, c) => sum + (monthTotals[c.id] ?? 0), 0);

    return (
      <li key={category.id} className="overflow-hidden rounded-[22px] bg-surface-2">
        <div className="flex items-center gap-1 pr-2">
          <button
            type="button"
            onClick={() => (children.length > 0 ? toggleExpanded(category.id) : openEdit(category))}
            aria-expanded={children.length > 0 ? isOpen : undefined}
            className="flex min-w-0 flex-1 items-center gap-3.5 px-4 py-3 text-left"
          >
            <IconChip icon={category.icon} color={category.color} size="lg" flat />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold text-text-primary">
                {category.name}
                {category.isArchived && <span className="ml-2 text-xs font-normal text-text-secondary">Archived</span>}
              </span>
              <span className="mt-0.5 block text-xs text-text-secondary">
                {childSummary} · {money(total)} this month
              </span>
            </span>
            {children.length > 0 && (
              <ChevronDown size={20} className={cn("shrink-0 text-text-secondary transition-transform", isOpen && "rotate-180")} />
            )}
          </button>
          {optionsMenu(category)}
        </div>

        {isOpen && (
          <div className="flex flex-col gap-1.5 pb-3 pl-19 pr-4">
            {children.map((child) => (
              <div key={child.id} className="flex items-center gap-1 rounded-[14px] bg-surface py-1 pl-3.5 pr-1 text-sm font-semibold">
                <span className="min-w-0 flex-1 truncate">
                  {child.name}
                  {child.isArchived && <span className="ml-2 text-xs font-normal text-text-secondary">Archived</span>}
                </span>
                <span className="text-text-secondary">{money(monthTotals[child.id] ?? 0)}</span>
                {optionsMenu(child)}
              </div>
            ))}
            <button
              type="button"
              onClick={() => openAddSub(category)}
              className="h-10 rounded-[14px] border-2 border-dashed border-accent-border text-[0.8125rem] font-bold text-text-secondary hover:bg-surface-3"
            >
              Add subcategory
            </button>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-4">
      <BackHeader
        desktopRoot
        href="/profile"
        title="Categories"
        action={
          <button
            type="button"
            aria-label="New category"
            onClick={openAdd}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-accent text-text-on-accent transition-colors hover:bg-accent-hover"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        }
      />

      <SegmentedControl
        value={type}
        onChange={setType}
        options={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Tags} title="No categories yet" description="Add a category to start organizing your transactions." />
      ) : (
        <ul className="flex flex-col gap-2">{topLevel.map(renderCategory)}</ul>
      )}

      <p className="text-center text-xs text-text-secondary">Archived categories keep your history and are hidden from pickers.</p>

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit category" : "Add category"}
        stackLevel={openedFromPicker ? 1 : 0}
      >
        <CategoryForm
          editing={editing}
          defaultType={type}
          defaultParentId={presetParentId}
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
