export const ACCOUNT_TYPES = [
  { value: "BANK", label: "Bank account", icon: "landmark" },
  { value: "CASH", label: "Cash", icon: "banknote" },
  { value: "CREDIT_CARD", label: "Credit card", icon: "credit-card" },
  { value: "WALLET", label: "Wallet", icon: "wallet" },
  { value: "UPI", label: "UPI", icon: "smartphone" },
  { value: "SAVINGS", label: "Savings", icon: "piggy-bank" },
  { value: "INVESTMENT", label: "Investment", icon: "trending-up" },
  { value: "OTHER", label: "Other", icon: "circle-dollar-sign" },
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number]["value"];

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
  { name: "Other", icon: "more-horizontal", color: "slate" },
];

export const DEFAULT_INCOME_CATEGORIES: Array<{ name: string; icon: string; color: string }> = [
  { name: "Salary", icon: "briefcase", color: "indigo" },
  { name: "Freelance", icon: "laptop", color: "cyan" },
  { name: "Investments", icon: "trending-up", color: "lime" },
  { name: "Gifts", icon: "gift", color: "pink" },
  { name: "Other income", icon: "more-horizontal", color: "slate" },
];
