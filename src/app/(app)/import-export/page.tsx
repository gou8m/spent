import { ExportCard } from "@/components/import-export/export-card";
import { ImportCard } from "@/components/import-export/import-card";
import { BackupCard } from "@/components/import-export/backup-card";

export default function ImportExportPage() {
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Import & export</h1>
      <ExportCard />
      <ImportCard />
      <BackupCard />
    </div>
  );
}
