/**
 * Built-in hints for guessing a category from what someone typed as the merchant or
 * title (e.g. "Uber ride" -> Transport). Each entry names one of the DEFAULT category
 * names; the caller looks up the user's own category with that name, so this silently
 * does nothing for anyone who renamed or removed it. Words are matched whole-word,
 * case-insensitively, against the title.
 */
export interface KeywordRule {
  /** Name of a default expense/income category (see DEFAULT_*_CATEGORIES). */
  category: string;
  type: "EXPENSE" | "INCOME";
  words: string[];
}

export const CATEGORY_KEYWORDS: KeywordRule[] = [
  { category: "Groceries", type: "EXPENSE", words: ["grocery", "groceries", "supermarket", "bigbasket", "blinkit", "zepto", "instamart", "dmart", "reliance fresh", "vegetables", "fruits", "kirana", "walmart", "costco", "aldi", "tesco", "whole foods", "trader joe"] },
  { category: "Milk & Dairy", type: "EXPENSE", words: ["milk", "dairy", "curd", "paneer", "amul", "nandini"] },
  { category: "Food", type: "EXPENSE", words: ["swiggy", "zomato", "restaurant", "cafe", "coffee", "starbucks", "dominos", "pizza", "burger", "mcdonalds", "kfc", "lunch", "dinner", "breakfast", "biryani", "snacks", "tea", "chai", "bakery", "takeaway", "doordash", "ubereats"] },
  { category: "Fuel", type: "EXPENSE", words: ["petrol", "diesel", "fuel", "gas station", "hp", "indian oil", "bharat petroleum", "shell", "cng"] },
  { category: "Transport", type: "EXPENSE", words: ["uber", "ola", "rapido", "metro", "bus", "train", "irctc", "auto", "cab", "taxi", "lyft", "toll", "fastag", "parking"] },
  { category: "Electricity", type: "EXPENSE", words: ["electricity", "electric", "power bill", "bescom", "tneb", "msedcl"] },
  { category: "Mobile Recharge", type: "EXPENSE", words: ["recharge", "jio", "airtel", "vi", "vodafone", "bsnl", "prepaid", "postpaid"] },
  { category: "Internet", type: "EXPENSE", words: ["internet", "wifi", "broadband", "fibre", "fiber", "act fibernet"] },
  { category: "Water", type: "EXPENSE", words: ["water bill", "water can", "water tanker"] },
  { category: "Cooking Gas / LPG", type: "EXPENSE", words: ["lpg", "cylinder", "gas cylinder", "indane", "hp gas"] },
  { category: "Rent", type: "EXPENSE", words: ["rent", "landlord", "lease"] },
  { category: "Shopping", type: "EXPENSE", words: ["amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "mall", "clothes", "shoes", "ikea", "ebay", "shein"] },
  { category: "Pharmacy", type: "EXPENSE", words: ["pharmacy", "medicine", "medicines", "apollo pharmacy", "medplus", "1mg", "pharmeasy", "chemist"] },
  { category: "Doctor / Hospital", type: "EXPENSE", words: ["doctor", "hospital", "clinic", "dentist", "consultation", "lab test", "diagnostic"] },
  { category: "Entertainment", type: "EXPENSE", words: ["movie", "cinema", "pvr", "inox", "bookmyshow", "concert", "game", "steam", "playstation"] },
  { category: "Subscriptions", type: "EXPENSE", words: ["netflix", "spotify", "prime", "hotstar", "youtube premium", "icloud", "chatgpt", "subscription", "disney", "apple music", "sonyliv", "zee5"] },
  { category: "Self Care", type: "EXPENSE", words: ["salon", "haircut", "spa", "grooming", "barber", "parlour", "parlor"] },
  { category: "Gym Membership", type: "EXPENSE", words: ["gym", "cult", "cultfit", "fitness"] },
  { category: "Education", type: "EXPENSE", words: ["school", "college", "tuition", "course", "udemy", "coursera", "books", "fees", "exam"] },
  { category: "Pets", type: "EXPENSE", words: ["vet", "pet food", "dog", "cat food", "pet"] },
  { category: "Travel", type: "EXPENSE", words: ["flight", "hotel", "airbnb", "makemytrip", "goibibo", "booking.com", "resort", "holiday", "trip", "airline", "indigo"] },
  { category: "Health Insurance", type: "EXPENSE", words: ["health insurance", "mediclaim"] },
  { category: "Term Insurance", type: "EXPENSE", words: ["term insurance", "life insurance", "lic"] },
  { category: "SIP", type: "EXPENSE", words: ["sip", "mutual fund", "zerodha coin", "groww", "index fund"] },
  { category: "Gifts & Donations", type: "EXPENSE", words: ["gift", "donation", "charity", "temple", "birthday gift"] },
  { category: "Loan/EMI", type: "EXPENSE", words: ["emi", "loan emi", "home loan", "car loan", "credit card bill"] },
  { category: "Income Tax", type: "EXPENSE", words: ["income tax", "advance tax", "tds"] },
  { category: "Salary", type: "INCOME", words: ["salary", "payroll", "wages", "paycheck", "pay check"] },
  { category: "Freelance", type: "INCOME", words: ["freelance", "client payment", "invoice", "consulting"] },
  { category: "Investments", type: "INCOME", words: ["dividend", "interest", "capital gain", "maturity", "fd interest"] },
  { category: "Gifts", type: "INCOME", words: ["gift received", "birthday money"] },
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The default category name a title most plausibly belongs to, or null. Longer keywords
 * win over shorter ones ("gas cylinder" over "gas"), so more specific rules take priority. */
export function suggestCategoryName(title: string, type: "EXPENSE" | "INCOME"): string | null {
  const text = ` ${title.toLowerCase().replace(/[^a-z0-9.&' ]+/g, " ")} `;
  let best: { category: string; length: number } | null = null;
  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.type !== type) continue;
    for (const word of rule.words) {
      if (new RegExp(`\\s${escape(word)}\\s`).test(text) && (!best || word.length > best.length)) {
        best = { category: rule.category, length: word.length };
      }
    }
  }
  return best?.category ?? null;
}
