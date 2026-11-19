"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Tags,
  Loader2,
  ChevronDown,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  GitMerge,
  Archive,
  ArchiveRestore,
  Sparkles,
} from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { IconChip } from "@/components/ui/icon-chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CategoryForm, type EditableCategory } from "@/components/categories/category-form";
import { CategoryDetail } from "@/components/categories/category-detail";
import { MergeCategorySheet } from "@/components/categories/merge-category-sheet";
import { SuggestedCategoriesSheet } from "@/components/categories/suggested-categories-sheet";
import { deleteCategoryAction, moveCategoryAction, setCategoryArchivedAction } from "@/actions/categories";
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
  const [type, setType] = useState<"EXPENSE" | "INCOME">(searchParams.get("type") === "INCOME" ? "INCOME" : "EXPENSE");
  // Arriving from the "Custom" button in a category picker (?add=1&type=...) jumps
  // straight into the add-category sheet instead of making the user find the button.
  // That picker lives inside the global Add Transaction sheet, which this navigation
  // doesn't close (its open state lives outside this page) — so this sheet can open
  // while that one is still open underneath; stackLevel keeps this one's own dimming
  // overlay from rendering invisibly behind the still-open transaction sheet's content.
  const [openedFromPicker] = useState(() => searchParams.get("add") === "1");
  const [sheetOpen, setSheetOpen] = useState(openedFromPicker);
  const [editing, setEditing] = useState<EditableCategory | undefined>(undefined);
  const [presetParentId, setPresetParentId] = useState<string | undefined>(undefined);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRecord | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      router.replace("/profile/categories", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only meant to fire once, off the initial query string
  }, []);

  const active = useMemo(() => categories.filter((c) => c.type === type && !c.isArchived), [categories, type]);
  const archived = useMemo(() => categories.filter((c) => c.type === type && c.isArchived), [categories, type]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string, CategoryRecord[]>();
    for (const c of active) {
      if (!c.parentId) continue;
      if (!map.has(c.parentId)) map.set(c.parentId, []);
      map.get(c.parentId)!.push(c);
    }
    return map;
  }, [active]);
  const topLevel = useMemo(() => active.filter((c) => !c.parentId), [active]);
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const parentCandidates = useMemo(
    () => categories.filter((c) => !c.isArchived).map((c) => ({ id: c.id, name: c.name, type: c.type as "INCOME" | "EXPENSE", parentId: c.parentId })),
    [categories],
  );

  const detail = detailId ? byId.get(detailId) ?? null : null;
  const mergeSource = mergeSourceId ? byId.get(mergeSourceId) ?? null : null;

  function refresh() {
    router.refresh();
  }

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
    setDetailId(null);
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

  async function run(category: CategoryRecord, task: () => Promise<{ error?: string }>, success?: string) {
    setBusyId(category.id);
    const result = await task();
    setBusyId(null);
    if (result.error) toast.error(result.error);
    else {
      if (success) toast.success(success);
      refresh();
    }
    return result;
  }

  const handleMove = (category: CategoryRecord, direction: "up" | "down") => run(category, () => moveCategoryAction(category.id, direction));

  async function handleArchive(category: CategoryRecord, archive: boolean) {
    setDetailId(null);
    await run(category, () => setCategoryArchivedAction(category.id, archive), archive ? `"${category.name}" archived` : `"${category.name}" restored`);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setBusyId(target.id);
    const result = await deleteCategoryAction(target.id);
    setBusyId(null);
    setDeleteTarget(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.archived ? `"${target.name}" is in use, so it was archived instead` : `"${target.name}" deleted`);
      refresh();
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

  function optionsMenu(category: CategoryRecord, siblings: CategoryRecord[]) {
    const index = siblings.findIndex((s) => s.id === category.id);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={busyId === category.id}
            aria-label={`${category.name} options`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-3 disabled:opacity-50"
          >
            {busyId === category.id ? <Loader2 size={17} className="animate-spin" /> : <MoreHorizontal size={18} />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => openEdit(category)}>
            <Pencil size={14} /> Edit
          </DropdownMenuItem>
          {index > 0 && (
            <DropdownMenuItem onClick={() => handleMove(category, "up")}>
              <ArrowUp size={14} /> Move up
            </DropdownMenuItem>
          )}
          {index >= 0 && index < siblings.length - 1 && (
            <DropdownMenuItem onClick={() => handleMove(category, "down")}>
              <ArrowDown size={14} /> Move down
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setMergeSourceId(category.id)}>
            <GitMerge size={14} /> Merge into…
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleArchive(category, true)}>
            <Archive size={14} /> Archive
          </DropdownMenuItem>
          <DropdownMenuItem destructive onClick={() => setDeleteTarget(category)}>
            <Trash2 size={14} /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function renderCategory(category: CategoryRecord) {
    const children = childrenByParent.get(category.id) ?? [];
    const isOpen = expanded.has(category.id);
    const childSummary = children.length === 0 ? "No subcategories" : `${children.length} ${children.length === 1 ? "subcategory" : "subcategories"}`;
    // A parent's figure also counts what its subcategories spent, matching how budgets treat a parent.
    const total = (monthTotals[category.id] ?? 0) + children.reduce((sum, c) => sum + (monthTotals[c.id] ?? 0), 0);

    return (
      <li key={category.id} className="overflow-hidden rounded-[22px] bg-surface-2">
        <div className="flex items-center gap-1 pr-2">
          <button type="button" onClick={() => setDetailId(category.id)} className="flex min-w-0 flex-1 items-center gap-3.5 px-4 py-3 text-left">
            <IconChip icon={category.icon} color={category.color} size="lg" flat />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold text-text-primary">{category.name}</span>
              <span className="mt-0.5 block text-xs text-text-secondary">
                {childSummary} · {money(total)} this month
              </span>
            </span>
          </button>
          {children.length > 0 && (
            <button
              type="button"
              aria-label={isOpen ? `Hide ${category.name} subcategories` : `Show ${category.name} subcategories`}
              aria-expanded={isOpen}
              onClick={() => toggleExpanded(category.id)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-3"
            >
              <ChevronDown size={20} className={cn("transition-transform", isOpen && "rotate-180")} />
            </button>
          )}
          {optionsMenu(category, topLevel)}
        </div>

        {isOpen && (
          <div className="flex flex-col gap-1.5 pb-3 pl-19 pr-4">
            {children.map((child) => (
              <div key={child.id} className="flex items-center gap-1 rounded-[14px] bg-surface py-1 pl-3.5 pr-1 text-sm font-semibold">
                <button type="button" onClick={() => setDetailId(child.id)} className="flex min-w-0 flex-1 items-center justify-between gap-2 py-1.5 text-left">
                  <span className="truncate">{child.name}</span>
                  <span className="text-text-secondary">{money(monthTotals[child.id] ?? 0)}</span>
                </button>
                {optionsMenu(child, children)}
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

  const detailCategory = detail
    ? {
        id: detail.id,
        name: detail.name,
        type: detail.type as "INCOME" | "EXPENSE",
        icon: detail.icon,
        color: detail.color,
        isArchived: detail.isArchived,
        parentName: detail.parentId ? byId.get(detail.parentId)?.name : undefined,
        subcategories: (childrenByParent.get(detail.id) ?? []).map((c) => ({ id: c.id, name: c.name })),
      }
    : null;

  const mergeCandidates = categories
    .filter((c) => c.type === mergeSource?.type && !c.isArchived && c.id !== mergeSource?.id && c.parentId !== mergeSource?.id)
    .map((c) => ({ id: c.id, name: c.name, parentId: c.parentId, parentName: c.parentId ? byId.get(c.parentId)?.name : undefined }));

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

      {active.length === 0 ? (
        <EmptyState icon={Tags} title="No categories yet" description="Add a category to start organizing your transactions." />
      ) : (
        <ul key={type} className="animate-fade-up flex flex-col gap-2">{topLevel.map(renderCategory)}</ul>
      )}

      <button
        type="button"
        onClick={() => setSuggestOpen(true)}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-accent-subtle text-[0.9375rem] font-bold text-accent-hover transition-colors hover:bg-surface-3"
      >
        <Sparkles size={18} strokeWidth={2} />
        Add suggested categories
      </button>

      {archived.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            aria-expanded={showArchived}
            className="flex w-full items-center justify-between py-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary"
          >
            Archived ({archived.length})
            <ChevronDown size={18} className={cn("transition-transform", showArchived && "rotate-180")} />
          </button>
          {showArchived && (
            <ul className="flex flex-col gap-2">
              {archived.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-[18px] bg-surface-2 px-4 py-2.5 opacity-80">
                  <IconChip icon={c.icon} color={c.color} size="md" flat />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
                    {c.name}
                    {c.parentId && byId.get(c.parentId) ? <span className="font-normal text-text-secondary"> · {byId.get(c.parentId)!.name}</span> : null}
                  </span>
                  <button
                    type="button"
                    disabled={busyId === c.id}
                    onClick={() => handleArchive(c, false)}
                    className="flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-[0.8125rem] font-bold text-accent-hover disabled:opacity-50"
                  >
                    <ArchiveRestore size={14} strokeWidth={2.25} />
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="text-center text-xs text-text-secondary">Archived categories keep your history and are hidden from pickers.</p>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? "Edit category" : "Add category"} stackLevel={openedFromPicker ? 1 : 0}>
        <CategoryForm
          editing={editing}
          defaultType={type}
          defaultParentId={presetParentId}
          allCategories={parentCandidates}
          onSaved={() => {
            setSheetOpen(false);
            refresh();
          }}
        />
      </Sheet>

      <Sheet open={!!detailCategory} onOpenChange={(o) => !o && setDetailId(null)} title="Category" hideHeader>
        {detailCategory && detail && (
          <CategoryDetail
            category={detailCategory}
            onEdit={() => openEdit(detail)}
            onMerge={() => {
              setDetailId(null);
              setMergeSourceId(detail.id);
            }}
            onToggleArchive={() => handleArchive(detail, !detail.isArchived)}
            onNavigate={() => setDetailId(null)}
          />
        )}
      </Sheet>

      <MergeCategorySheet
        open={!!mergeSource}
        onOpenChange={(o) => !o && setMergeSourceId(null)}
        source={mergeSource ? { id: mergeSource.id, name: mergeSource.name, hasChildren: (childrenByParent.get(mergeSource.id) ?? []).length > 0 } : null}
        candidates={mergeCandidates}
        onDone={refresh}
      />

      <SuggestedCategoriesSheet open={suggestOpen} onOpenChange={setSuggestOpen} type={type} onDone={refresh} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        icon={<Trash2 size={24} strokeWidth={2} />}
        description="Used categories are archived, not deleted. Use Merge to move their transactions."
        confirmLabel="Delete"
        destructive
        isConfirming={busyId === deleteTarget?.id}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
