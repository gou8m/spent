import { BackupCard } from "@/components/import-export/backup-card";

export default function ImportExportPage() {
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Backup & restore</h1>
      <BackupCard />
    </div>
  );
}
