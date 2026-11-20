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

/** Names that are clearly a bank on their own (matched as whole words after normalising). */
const BANK_WORDS = new Set([
  "iob", "sbi", "hdfc", "icici", "pnb", "kotak", "canara", "idfc", "indusind", "bandhan", "rbl", "uco", "kvb", "hsbc",
  "citibank", "citi", "dbs", "ujjivan", "equitas", "baroda", "bank", "banks", "nbfc", "fincorp", "finserv",
]);
/** Bank brands that are also common words or first names, so they only count next to the word "bank". */
const BANK_WITH_BANK_WORD = new Set(["axis", "federal", "yes", "union", "central", "indian", "bob", "boi", "city", "karur", "south", "tmb", "sib", "dcb", "csb", "au", "standard", "chartered"]);

/**
 * Does this name read like a bank? "IOB", "SBI", "HDFC Bank", "Axis Bank", "Bank of Baroda" do; "Bob" and
 * "Axis cafe" do not. Used as the first guess for a chat's type, before the person says otherwise.
 */
export function looksLikeBank(rawName: string): boolean {
  const words = normalizeName(rawName).split(" ").filter(Boolean);
  if (words.length === 0) return false;
  if (words.some((w) => BANK_WORDS.has(w))) return true;
  const hasBankWord = words.includes("bank") || words.includes("banking");
  return hasBankWord && words.some((w) => BANK_WITH_BANK_WORD.has(w));
}

/** Brands and kinds of business that are clearly shops or merchants, so the chat does not ask about them. */
const MERCHANT_WORDS = new Set([
  "amazon", "flipkart", "irctc", "swiggy", "zomato", "uber", "ola", "rapido", "myntra", "ajio", "nykaa", "bigbasket", "blinkit", "zepto",
  "dmart", "reliance", "jio", "airtel", "bsnl", "netflix", "spotify", "hotstar", "prime", "youtube", "google", "apple", "microsoft", "paytm",
  "phonepe", "gpay", "bookmyshow", "makemytrip", "goibibo", "redbus", "cleartrip", "ixigo", "dominos", "mcdonalds", "kfc", "starbucks",
  "cafe", "restaurant", "hotel", "store", "mart", "supermarket", "pharmacy", "medical", "hospital", "clinic", "petrol", "fuel", "bpcl", "hpcl",
  "indianoil", "shell", "lic", "insurance", "electricity", "bescom", "broadband", "recharge", "mobile", "shop", "shopping", "traders",
  "stores", "bakery", "bakers", "sweets", "salon", "cinema", "travels", "airlines", "railway", "metro", "bus", "taxi", "cab",
  "supermart", "bazaar", "bazar", "kirana", "electronics", "jewellers", "jewellery", "textiles", "hardware", "stationery", "enterprises",
]);

/** Does this name read like a known shop or merchant (Amazon, IRCTC, Swiggy, "Krishna Medical")? */
export function looksLikeMerchant(rawName: string): boolean {
  return normalizeName(rawName).split(" ").some((w) => MERCHANT_WORDS.has(w));
}

/** The categories (by name) that mean "this is about a person": lending, borrowing, repaying. */
export const PERSON_CATEGORY_NAMES = new Set<string>([
  OTHER_TRANSFER_CATEGORY_NAME,
  LOAN_REPAYMENT_EXPENSE_CATEGORY_NAME,
  LOAN_REPAYMENT_INCOME_CATEGORY_NAME,
  LOAN_INCOME_CATEGORY_NAME,
]);
