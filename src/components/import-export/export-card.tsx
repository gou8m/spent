import { Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ExportCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm text-text-secondary">
          Download every transaction as a CSV file — account, category, amount, date, and note included.
        </p>
        <a
          href="/api/export/transactions"
          download
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-text-on-accent shadow-sm transition-colors hover:bg-accent-hover"
        >
          <Download size={16} strokeWidth={2.25} />
          Export transactions (CSV)
        </a>
      </CardContent>
    </Card>
  );
}
