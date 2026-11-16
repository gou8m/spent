"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { Download, Upload, ShieldCheck, ShieldAlert } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { restoreBackupAction, clearAllDataAction } from "@/actions/backup";

export function BackupCard({
  lastBackupAt,
  lastBackupFilename,
}: {
  lastBackupAt: Date | null;
  lastBackupFilename: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = ""; // allow re-selecting the same file later
  }

  async function handleConfirmRestore() {
    if (!pendingFile) return;
    setIsRestoring(true);
    const text = await pendingFile.text();
    const result = await restoreBackupAction(text);
    setIsRestoring(false);
    setPendingFile(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    const c = result.counts!;
    toast.success(`Restored ${c.accounts} accounts, ${c.transactions} transactions, ${c.categories} categories`);
    router.refresh();
  }

  async function handleConfirmClear() {
    setIsClearing(true);
    await clearAllDataAction();
    setIsClearing(false);
    setIsClearOpen(false);
    toast.success("All data cleared — back to a fresh start");
    router.refresh();
  }

  const hasBackup = !!lastBackupAt;

  return (
    <>
      <section className="rounded-[28px] px-5.5 py-5 text-hero-text" style={{ background: "var(--hero-gradient)" }}>
        <div className="flex items-center gap-2.5 text-[0.9375rem] font-bold text-hero-text-secondary">
          {hasBackup ? <ShieldCheck size={20} strokeWidth={2} /> : <ShieldAlert size={20} strokeWidth={2} />}
          {hasBackup ? "Your data is backed up" : "No backup yet"}
        </div>
        <p className="mt-2 text-[1.625rem] font-extrabold tracking-[-0.8px]">
          {hasBackup ? `${formatDistanceToNow(lastBackupAt, { addSuffix: true })}` : "Download your first one"}
        </p>
        <p className="mt-0.5 truncate text-[0.8125rem] font-semibold text-hero-text-secondary" title={lastBackupAt ? format(lastBackupAt, "MMM d, yyyy 'at' h:mm a") : undefined}>
          {hasBackup
            ? (lastBackupFilename ?? format(lastBackupAt, "MMM d, yyyy 'at' h:mm a"))
            : "A full JSON copy of every account, transaction, budget and goal."}
        </p>
        <a
          href="/api/export/backup"
          download
          className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-accent text-[0.9375rem] font-bold text-text-on-accent transition-colors hover:bg-accent-hover"
        >
          <Download size={18} strokeWidth={2} />
          Download backup
        </a>
      </section>

      <section className="rounded-3xl bg-surface-2 px-4.5 py-4">
        <h2 className="text-[1.0625rem] font-bold text-text-primary">Restore from backup</h2>
        <p className="mt-1 text-[0.8125rem] leading-snug text-text-secondary">
          Replaces everything in your account with the file&apos;s contents.
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 flex h-19 w-full flex-col items-center justify-center gap-1 rounded-[18px] border-2 border-dashed border-accent-border text-sm font-bold text-text-secondary transition-colors hover:bg-surface-3"
        >
          <Upload size={20} strokeWidth={2} />
          Choose a .json backup file
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileSelect} />
      </section>

      <section className="rounded-3xl bg-error-subtle px-4.5 py-4">
        <h2 className="text-[1.0625rem] font-bold text-error">Danger zone</h2>
        <p className="mt-1 text-[0.8125rem] leading-snug text-error/80">
          Clear all data resets accounts, categories and transactions to a fresh start. Download a backup first.
        </p>
        <button
          type="button"
          onClick={() => setIsClearOpen(true)}
          className="mt-3 h-12.5 w-full rounded-[18px] bg-surface text-[0.9375rem] font-bold text-error transition-opacity hover:opacity-90"
        >
          Clear all data
        </button>
      </section>

      <ConfirmDialog
        open={!!pendingFile}
        onOpenChange={(open) => !open && !isRestoring && setPendingFile(null)}
        title="Replace all current data?"
        description={`Restoring "${pendingFile?.name}" deletes every account, category, transaction, budget, goal, and recurring rule you currently have and replaces them with what's in this file. This can't be undone — make sure you have a current backup first if you're not sure.`}
        confirmLabel="Restore"
        destructive
        isConfirming={isRestoring}
        onConfirm={handleConfirmRestore}
      />

      <ConfirmDialog
        open={isClearOpen}
        onOpenChange={(open) => !isClearing && setIsClearOpen(open)}
        title={hasBackup ? "Clear all data?" : "No backup on file yet"}
        description={
          hasBackup
            ? `This permanently deletes everything and resets you to a fresh start (default categories, a starting Cash account) — your most recent backup is from ${format(lastBackupAt!, "MMM d, yyyy 'at' h:mm a")}, so you can restore from it afterward if needed, but anything added since then will be lost for good.`
            : "You haven't downloaded a backup yet. Clearing now permanently deletes everything and resets you to a fresh start, with no way to get what you had back. Proceed anyway?"
        }
        confirmLabel={hasBackup ? "Clear all data" : "Proceed anyway"}
        destructive
        isConfirming={isClearing}
        onConfirm={handleConfirmClear}
      />
    </>
  );
}
