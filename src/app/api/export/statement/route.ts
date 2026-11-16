import { format } from "date-fns";
import { requireUserId } from "@/lib/auth-helpers";
import { getStatementData } from "@/lib/statement";
import { resolveStatementRange } from "@/lib/statement-range";
import { renderStatementPdf } from "@/lib/pdf/statement-pdf";

export const dynamic = "force-dynamic";

/** GET /api/export/statement?range=last-month|3-months|6-months|custom[&from=yyyy-MM-dd&to=yyyy-MM-dd]
 * Streams the signed-in user's statement as a PDF download. */
export async function GET(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return Response.json({ error: "Please sign in" }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;

  const resolved = resolveStatementRange(params.get("range") ?? "", params.get("from"), params.get("to"));
  if ("error" in resolved) return Response.json({ error: resolved.error }, { status: 400 });

  const data = await getStatementData(userId, resolved.start, resolved.end);
  const pdf = await renderStatementPdf(data);
  const filename = `spent-statement-${format(resolved.start, "yyyy-MM-dd")}-to-${format(resolved.end, "yyyy-MM-dd")}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
