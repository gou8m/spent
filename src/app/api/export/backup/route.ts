import { format } from "date-fns";
import { requireUserId } from "@/lib/auth-helpers";
import { exportUserBackup } from "@/lib/backup";

export async function GET() {
  const userId = await requireUserId();
  const backup = await exportUserBackup(userId);
  const filename = `spent-backup-${format(new Date(), "yyyy-MM-dd")}.json`;

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
