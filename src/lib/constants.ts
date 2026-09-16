import packageJson from "../../package.json";

/** Single source of truth for the version shown on the profile page's About
 * card — bump `package.json`'s `version` at release time and this follows. */
export const APP_VERSION = packageJson.version;

export const ACCOUNT_TYPES = [
  { value: "BANK", label: "Bank account", icon: "landmark" },
  { value: "CASH", label: "Cash", icon: "banknote" },
  { value: "CREDIT_CARD", label: "Credit card", icon: "credit-card" },
  { value: "WALLET", label: "Wallet", icon: "wallet" },
  { value: "UPI", label: "UPI", icon: "smartphone" },
  { value: "SAVINGS", label: "Emergency Fund", icon: "gem" },
  { value: "INVESTMENT", label: "Investment", icon: "trending-up" },
  { value: "OTHER", label: "Other", icon: "circle-dollar-sign" },
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number]["value"];

/** Only shown when Account.type === "BANK" — everyday-spend savings vs. current/checking. */
export const BANK_SUBTYPES = [
  { value: "SAVINGS", label: "Savings" },
  { value: "CURRENT", label: "Current" },
] as const;
export type BankSubtype = (typeof BANK_SUBTYPES)[number]["value"];

/** Curated icon choices per account type, shown in the account form's icon
 * picker instead of the full generic icon list — mirrors the preset avatar
 * picker's spirit of type-appropriate options rather than one giant grid. */
export const ACCOUNT_TYPE_ICONS: Record<string, string[]> = {
  BANK: ["landmark", "building", "banknote", "wallet", "credit-card", "receipt", "calculator", "coins"],
  CASH: ["wallet", "banknote", "coins", "hand-coins", "receipt", "tag", "circle-dollar-sign", "gem"],
  CREDIT_CARD: ["credit-card", "wallet", "receipt", "tag", "coins", "banknote", "calculator", "circle-dollar-sign"],
  WALLET: ["wallet", "smartphone", "circle-dollar-sign", "tag", "banknote", "coins", "receipt", "gem"],
  UPI: ["smartphone", "wallet", "phone", "wifi", "circle-dollar-sign", "banknote", "tag", "coins"],
  SAVINGS: ["gem", "shield", "umbrella", "coins", "target", "banknote", "wallet", "star"],
  INVESTMENT: ["trending-up", "gem", "target", "briefcase", "building", "coins", "calculator", "star"],
  OTHER: ["circle-dollar-sign", "circle", "tag", "star", "wallet", "banknote", "coins", "receipt"],
};

export const TRANSACTION_TYPES = ["EXPENSE", "INCOME", "TRANSFER"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = ["COMPLETED", "UPCOMING"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const BUDGET_PERIODS = ["WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"] as const;
export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];

export const RECURRING_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export const GOAL_STATUSES = ["ACTIVE", "COMPLETED", "ARCHIVED"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

/** Lifetime cap on primary-currency changes — cheap guardrail against
 * flip-flopping, since it drives which accounts count toward the dashboard's
 * headline total balance. Google OAuth signups start at USD (no signup form
 * to pick one) and use this same control to set their real currency. */
export const MAX_CURRENCY_CHANGES = 3;

/** Support contact shown once a user hits the currency-change cap. */
export const SUPPORT_EMAIL = "help@spentonline.in";

/** Common currencies. Not exhaustive — chosen for broad, realistic coverage. */
export const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "$" },
  { code: "AUD", name: "Australian Dollar", symbol: "$" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
] as const;

export const DEFAULT_EXPENSE_CATEGORIES: Array<{ name: string; icon: string; color: string }> = [
  { name: "Groceries", icon: "shopping-cart", color: "emerald" },
  { name: "Dining", icon: "utensils", color: "orange" },
  { name: "Transport", icon: "car", color: "blue" },
  { name: "Housing", icon: "home", color: "indigo" },
  { name: "Utilities", icon: "plug", color: "amber" },
  { name: "Shopping", icon: "shopping-bag", color: "pink" },
  { name: "Health", icon: "heart-pulse", color: "rose" },
  { name: "Entertainment", icon: "clapperboard", color: "violet" },
  { name: "Travel", icon: "plane", color: "cyan" },
  { name: "Subscriptions", icon: "repeat", color: "slate" },
  { name: "Education", icon: "graduation-cap", color: "teal" },
  { name: "Self Care", icon: "scissors", color: "pink" },
  { name: "Fitness", icon: "dumbbell", color: "lime" },
  { name: "Pets", icon: "dog", color: "amber" },
  { name: "Insurance", icon: "umbrella", color: "blue" },
  { name: "Term Insurance", icon: "shield", color: "indigo" },
  { name: "Health Insurance", icon: "stethoscope", color: "cyan" },
  { name: "SIP", icon: "trending-up", color: "lime" },
  { name: "Car", icon: "car", color: "slate" },
  { name: "Bike", icon: "bike", color: "teal" },
  { name: "Kids & Family", icon: "baby", color: "rose" },
  { name: "Gifts & Donations", icon: "gift", color: "violet" },
  { name: "Rent", icon: "home", color: "blue" },
  { name: "Loan/EMI", icon: "receipt", color: "orange" },
  { name: "Emergency Fund", icon: "gem", color: "amber" },
  { name: "Transfer", icon: "hand-coins", color: "slate" },
  { name: "Other", icon: "more-horizontal", color: "slate" },
];

export const DEFAULT_INCOME_CATEGORIES: Array<{ name: string; icon: string; color: string }> = [
  { name: "Salary", icon: "briefcase", color: "indigo" },
  { name: "Freelance", icon: "laptop", color: "cyan" },
  { name: "Investments", icon: "trending-up", color: "lime" },
  { name: "Gifts", icon: "gift", color: "pink" },
  { name: "Other income", icon: "more-horizontal", color: "slate" },
];

/** Recurring rules only ever need a handful of categories (rent, EMIs, SIPs…), not the
 * full everyday-spend list — this trims whatever categories the user has down to the
 * ones that actually recur. Matched by name against the user's own categories, so it
 * silently no-ops for anyone who has renamed/deleted these. */
export const RECURRING_CATEGORY_NAMES = [
  "Rent",
  "SIP",
  "Term Insurance",
  "Health Insurance",
  "Loan/EMI",
  "Subscriptions",
  "Emergency Fund",
  "Salary",
];

/** The one category that maps a recurring rule straight to the user's Emergency Fund
 * account — see RecurringForm. */
export const EMERGENCY_FUND_CATEGORY_NAME = "Emergency Fund";

/** Used for "other transfer" (money leaving to someone outside the user's own accounts,
 * e.g. a friend or a hospital) — modeled as an EXPENSE under this category rather than a
 * real Transfer, since there's no destination account to credit. */
export const OTHER_TRANSFER_CATEGORY_NAME = "Transfer";
