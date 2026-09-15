import { BackupCard } from "@/components/import-export/backup-card";
import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";

export default async function ImportExportPage() {
  const userId = await requireUserId();
  const user = await getCurrentUser(userId);

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Backup & restore</h1>
      <BackupCard lastBackupAt={user.lastBackupAt} lastBackupFilename={user.lastBackupFilename} />
    </div>
  );
}
