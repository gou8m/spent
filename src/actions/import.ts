"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { analyzeImportCsv, type ImportRow } from "@/lib/import-transactions";

export interface PreviewResult {
  error?: string;
  rows?: ImportRow[];
  summary?: { total: number; valid: number; duplicates: number; errors: number };
}

export async function previewImportAction(csvText: string): Promise<PreviewResult> {
  const userId = await requireUserId();
  const { rows, error } = await analyzeImportCsv(userId, csvText);
  if (error) return { error };

  const summary = {
    total: rows.length,
    valid: rows.filter((r) => r.errors.length === 0 && !r.isDuplicate).length,
    duplicates: rows.filter((r) => r.errors.length === 0 && r.isDuplicate).length,
    errors: rows.filter((r) => r.errors.length > 0).length,
  };
  return { rows, summary };
}

export async function commitImportAction(
  csvText: string,
  includeDuplicates: boolean,
): Promise<{ error?: string; imported?: number; skipped?: number }> {
  const userId = await requireUserId();
  const { rows, error } = await analyzeImportCsv(userId, csvText);
  if (error) return { error };

  const toImport = rows.filter((r) => r.errors.length === 0 && (includeDuplicates || !r.isDuplicate));
  if (toImport.length === 0) return { imported: 0, skipped: rows.length };

  await prisma.transaction.createMany({
    data: toImport.map((r) => ({
      userId,
      accountId: r.accountId!,
      transferToAccountId: r.transferToAccountId,
      categoryId: r.categoryId,
      type: r.type!,
      amount: r.amountMinor!,
      transferToAmount: r.transferToAmountMinor,
      currency: r.currency,
      title: r.title,
      note: r.note || null,
      date: r.date!,
      status: r.status,
    })),
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  return { imported: toImport.length, skipped: rows.length - toImport.length };
}
