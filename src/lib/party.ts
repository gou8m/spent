import {
  OTHER_TRANSFER_CATEGORY_NAME,
  LOAN_INCOME_CATEGORY_NAME,
  LOAN_REPAYMENT_EXPENSE_CATEGORY_NAME,
  LOAN_REPAYMENT_INCOME_CATEGORY_NAME,
} from "@/lib/constants";

/**
 * "People & shops": transactions that share a name are grouped into one chat. These are the pure helpers
 * (no database), used by the server and by the transaction form alike so both agree on what "the same name" is.
 */

/** "  Ramesh K. " and "ramesh k" are the same party. Case, accents, punctuation and extra spaces are ignored. */
export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0] ?? "?";
  return (words.length > 1 ? first + (words[1][0] ?? "") : first).toUpperCase();
}

const TONES = ["emerald", "blue", "violet", "rose", "amber", "teal", "orange", "pink"] as const;

/** A stable colour per name, so the same person always has the same avatar. */
export function toneFor(key: string): (typeof TONES)[number] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** Do two different keys probably name the same person ("ramesh" and "ramesh k", "anitha" and "anita")? */
export function looksLikeSame(a: string, b: string): boolean {
  if (a === b || !a || !b) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length >= 3 && long.startsWith(short + " ")) return true; // "ramesh" + "ramesh k"
  return short.length >= 4 && !short.includes(" ") && !long.includes(" ") && editDistanceAtMostOne(short, long);
}

/** The categories (by name) that mean "this is about a person": lending, borrowing, repaying. */
export const PERSON_CATEGORY_NAMES = new Set<string>([
  OTHER_TRANSFER_CATEGORY_NAME,
  LOAN_REPAYMENT_EXPENSE_CATEGORY_NAME,
  LOAN_REPAYMENT_INCOME_CATEGORY_NAME,
  LOAN_INCOME_CATEGORY_NAME,
]);
