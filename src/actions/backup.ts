"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-helpers";
import { validateBackup, restoreUserBackup, clearUserData, BackupValidationError } from "@/lib/backup";

export interface RestoreResult {
  error?: string;
  counts?: { accounts: number; categories: number; transactions: number; budgets: number; goals: number; recurring: number };
}

export async function restoreBackupAction(jsonText: string): Promise<RestoreResult> {
  const userId = await requireUserId();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { error: "That file isn't valid JSON." };
  }

  try {
    validateBackup(parsed);
  } catch (e) {
    return { error: e instanceof BackupValidationError ? e.message : "Invalid backup file" };
  }

  const counts = await restoreUserBackup(userId, parsed);

  revalidatePath("/", "layout");
  return { counts };
}

export async function clearAllDataAction(): Promise<{ error?: string }> {
  const userId = await requireUserId();
  await clearUserData(userId);
  revalidatePath("/", "layout");
  return {};
}
