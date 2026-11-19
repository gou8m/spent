"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { getLoans } from "@/lib/data/loans";
import { getPartyThread } from "@/lib/data/parties";
import { getCurrentUser } from "@/lib/data/user";
import { normalizeName } from "@/lib/party";
import { settleLoanAction } from "@/actions/loans";

export interface PartyActionResult {
  error?: string;
}

function refresh() {
  revalidatePath("/people");
  revalidatePath("/loans");
  revalidatePath("/dashboard");
}

const keySchema = z.string().trim().min(1).max(200);

/** Settings that belong to one party: pinned, muted, or "treat as person / shop". */
export async function setPartyPrefsAction(
  rawKey: string,
  prefs: { pinned?: boolean; muted?: boolean; kind?: "PERSON" | "MERCHANT" | null },
): Promise<PartyActionResult> {
  const userId = await requireUserId();
  const key = normalizeName(keySchema.parse(rawKey));
  if (!key) return { error: "Missing name" };
  await prisma.party.upsert({
    where: { userId_key: { userId, key } },
    update: prefs,
    create: { userId, key, ...prefs },
  });
  refresh();
  return {};
}

/** Folds the chat named `fromKey` into `intoKey`. No transaction is renamed, and it can be undone. */
export async function mergePartiesAction(rawFrom: string, rawInto: string): Promise<PartyActionResult> {
  const userId = await requireUserId();
  const from = normalizeName(keySchema.parse(rawFrom));
  const into = normalizeName(keySchema.parse(rawInto));
  if (!from || !into || from === into) return { error: "Choose two different names" };

  const prefs = await prisma.party.findMany({ where: { userId } });
  const byKey = new Map(prefs.map((p) => [p.key, p]));
  // Follow the target to where it finally lives, and refuse a loop (A into B while B already points at A).
  let target = into;
  for (let hops = 0; hops < 8; hops++) {
    const next = byKey.get(target)?.mergedIntoKey;
    if (!next) break;
    target = next;
  }
  if (target === from) return { error: "Those two are already merged" };

  await prisma.$transaction([
    prisma.party.upsert({
      where: { userId_key: { userId, key: from } },
      update: { mergedIntoKey: target },
      create: { userId, key: from, mergedIntoKey: target },
    }),
    // Anything that was merged into `from` now follows it to the new home.
    prisma.party.updateMany({ where: { userId, mergedIntoKey: from }, data: { mergedIntoKey: target } }),
  ]);
  refresh();
  return {};
}

export async function unmergePartyAction(rawKey: string): Promise<PartyActionResult> {
  const userId = await requireUserId();
  const key = normalizeName(keySchema.parse(rawKey));
  await prisma.party.updateMany({ where: { userId, key }, data: { mergedIntoKey: null } });
  refresh();
  return {};
}

/** Waives every open loan with this person ("mark all square"). Each one is closed as waived, with its history kept. */
export async function markAllSquareAction(rawKey: string): Promise<PartyActionResult & { closed?: number }> {
  const userId = await requireUserId();
  const user = await getCurrentUser(userId);
  const thread = await getPartyThread(userId, normalizeName(keySchema.parse(rawKey)), user.currency);
  if (!thread) return { error: "Chat not found" };
  const open = thread.loans.filter((l) => l.state.status === "OPEN");
  if (open.length === 0) return { error: "There is nothing open to settle" };
  // Re-read from the source so a stale page cannot waive a loan that was just settled.
  const fresh = new Set((await getLoans(userId)).filter((l) => l.state.status === "OPEN").map((l) => l.id));
  let closed = 0;
  for (const loan of open) {
    if (!fresh.has(loan.id)) continue;
    const result = await settleLoanAction({ loanId: loan.id, mode: "WAIVE" });
    if (result.error) return { error: result.error, closed };
    closed++;
  }
  refresh();
  return { closed };
}
