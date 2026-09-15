"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DatabaseBackup, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { restoreBackupAction } from "@/actions/backup";

export function BackupCard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

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

  return (
    <Card>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-secondary">
          Download a full JSON backup of every account, category, transaction, budget, goal, and recurring rule — or restore
          from one. Restoring <strong className="text-text-primary">replaces all current data</strong>.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/export/backup"
            download
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-text-on-accent shadow-sm transition-colors hover:bg-accent-hover"
          >
            <DatabaseBackup size={16} strokeWidth={2.25} />
            Download backup
          </a>
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} strokeWidth={2.25} />
            Restore from backup
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileSelect} />
        </div>
      </CardContent>

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
    </Card>
  );
}
