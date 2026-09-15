import { format } from "date-fns";
import { requireUserId } from "@/lib/auth-helpers";
import { exportUserBackup } from "@/lib/backup";
import { prisma } from "@/lib/db";

export async function GET() {
  const userId = await requireUserId();
  const backup = await exportUserBackup(userId);
  const filename = `spent-backup-${format(new Date(), "yyyy-MM-dd")}.json`;

  await prisma.user.update({
    where: { id: userId },
    data: { lastBackupAt: new Date(), lastBackupFilename: filename },
  });

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
