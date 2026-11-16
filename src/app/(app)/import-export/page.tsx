import { BackupCard } from "@/components/import-export/backup-card";
import { BackHeader } from "@/components/layout/back-header";
import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";

export default async function ImportExportPage() {
  const userId = await requireUserId();
  const user = await getCurrentUser(userId);

  return (
    <div className="max-w-2xl space-y-4">
      <BackHeader href="/profile" title="Backup & restore" desktopRoot />
      <BackupCard lastBackupAt={user.lastBackupAt} lastBackupFilename={user.lastBackupFilename} email={user.email} />
    </div>
  );
}
