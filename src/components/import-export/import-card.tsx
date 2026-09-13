"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Download, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { previewImportAction, commitImportAction } from "@/actions/import";
import type { ImportRow } from "@/lib/import-transactions";
import type { PreviewResult } from "@/actions/import";

export function ImportCard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreview(null);
    const text = await file.text();
    setCsvText(text);

    setIsPreviewing(true);
    const result = await previewImportAction(text);
    setIsPreviewing(false);
    setPreview(result);
    if (result.error) toast.error(result.error);
  }

  function reset() {
    setFileName(null);
    setCsvText(null);
    setPreview(null);
    setIncludeDuplicates(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImport() {
    if (!csvText) return;
    setIsImporting(true);
    const result = await commitImportAction(csvText, includeDuplicates);
    setIsImporting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Imported ${result.imported} transaction${result.imported === 1 ? "" : "s"}${result.skipped ? ` (${result.skipped} skipped)` : ""}`);
    reset();
    router.refresh();
  }

  const rows = preview?.rows ?? [];
  const importableCount = rows.filter((r) => r.errors.length === 0 && (includeDuplicates || !r.isDuplicate)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm text-text-secondary">
          Upload a CSV with columns <code className="rounded bg-surface-2 px-1 py-0.5 text-xs">Date, Type, Account, Title, Amount, Currency</code>{" "}
          (plus optional Category, Note, Status, TransferToAccount, TransferToAmount) — the same format as Export.
          Accounts must already exist and match by name; unrecognized rows are flagged, not imported.
        </p>

        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isPreviewing}>
          <Download size={16} strokeWidth={2.25} />
          {fileName ?? "Choose CSV file"}
        </Button>

        {isPreviewing && <p className="text-sm text-text-muted">Analyzing…</p>}

        {preview?.summary && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-income-subtle px-3 py-1 font-medium text-income">
                <CheckCircle2 size={14} /> {preview.summary.valid} ready
              </span>
              {preview.summary.duplicates > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-subtle px-3 py-1 font-medium text-warning">
                  <Copy size={14} /> {preview.summary.duplicates} possible duplicate{preview.summary.duplicates === 1 ? "" : "s"}
                </span>
              )}
              {preview.summary.errors > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-error-subtle px-3 py-1 font-medium text-error">
                  <AlertCircle size={14} /> {preview.summary.errors} error{preview.summary.errors === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {preview.summary.duplicates > 0 && (
              <label className="flex items-center gap-2.5 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={includeDuplicates}
                  onChange={(e) => setIncludeDuplicates(e.target.checked)}
                  className="h-4 w-4 rounded border-border-strong accent-accent"
                />
                Import possible duplicates too
              </label>
            )}

            <div className="max-h-72 space-y-1.5 overflow-y-auto overscroll-contain rounded-2xl bg-surface-2/60 p-2">
              {rows.slice(0, 200).map((row) => (
                <ImportRowPreview key={row.line} row={row} />
              ))}
              {rows.length > 200 && (
                <p className="px-2 py-1 text-xs text-text-muted">…and {rows.length - 200} more row(s) not shown</p>
              )}
            </div>

            <Button type="button" onClick={handleImport} disabled={isImporting || importableCount === 0} className="w-full">
              {isImporting ? "Importing…" : `Import ${importableCount} transaction${importableCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ImportRowPreview({ row }: { row: ImportRow }) {
  const hasError = row.errors.length > 0;
  return (
    <div className="flex items-start gap-2.5 rounded-xl px-2 py-1.5">
      <span className="mt-0.5 shrink-0">
        {hasError ? (
          <AlertCircle size={14} className="text-error" />
        ) : row.isDuplicate ? (
          <Copy size={14} className="text-warning" />
        ) : (
          <CheckCircle2 size={14} className="text-income" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-text-primary">
          Line {row.line}: {row.title || "(no title)"}
          {row.amountMinor !== null && row.currency ? ` · ${formatMoney(row.amountMinor, row.currency)}` : ""}
          {row.date ? ` · ${format(row.date, "MMM d, yyyy")}` : ""}
        </p>
        {hasError && <p className="text-xs text-error">{row.errors.join("; ")}</p>}
        {!hasError && row.isDuplicate && <p className="text-xs text-warning">Looks like a duplicate of an existing transaction</p>}
      </div>
    </div>
  );
}
