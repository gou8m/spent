/**
 * User-facing release highlights, newest first — feeds /profile/about/versions.
 * Deliberately condensed from the full engineering history in the repo's TODO.md
 * (the internal "why" and "how" for every change) into plain, short, end-user
 * language: what changed, not how it was built. Add a new entry here whenever a
 * release ships something visible to users; skip pure internal refactors/hotfixes
 * that fix something before it shipped broadly.
 */

export interface ChangelogEntry {
  version: string;
  date: string;
  highlights: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "3.9.0",
    date: "September 16, 2026",
    highlights: [
      "Added holiday & festival notifications, based on your primary currency",
      "Fixed dropdowns not closing properly on mobile",
      "More icon choices when setting up an account",
      "New transactions no longer default to a random account — you choose one",
    ],
  },
  {
    version: "3.8.0",
    date: "September 16, 2026",
    highlights: [
      "Loading spinners on save/delete actions app-wide",
      "Clearer error message when a transaction is missing a category",
      "New hamburger menu (mobile) and Finance section (desktop sidebar) for quicker navigation",
      "Bigger, easier-to-read notification panel with a \"Clear All\" action",
    ],
  },
  {
    version: "3.7.0",
    date: "September 15, 2026",
    highlights: ["Quick-add chips for recently used payees when adding a transaction"],
  },
  {
    version: "3.6.0",
    date: "September 15, 2026",
    highlights: ["Smooth crossfade animation between pages", "One-time welcome notification for new and existing users"],
  },
  {
    version: "3.5.2",
    date: "September 15, 2026",
    highlights: ["Numbers now format correctly for your currency (e.g. lakh/crore grouping for ₹)"],
  },
  {
    version: "3.5.1",
    date: "September 15, 2026",
    highlights: ["Category auto-fills based on a payee you've used before"],
  },
  {
    version: "3.5.0",
    date: "September 15, 2026",
    highlights: ["Reports: added Net Worth Trend and Account Balances charts"],
  },
  {
    version: "3.4.0",
    date: "September 15, 2026",
    highlights: ["Alerts when a subscription's price changes", "Reports: added a Spending Trend chart"],
  },
  {
    version: "3.3.0",
    date: "September 15, 2026",
    highlights: ["Verified badge for consistently active accounts", "Redesigned dashboard balance and cash flow cards"],
  },
  {
    version: "3.2.0",
    date: "September 15, 2026",
    highlights: [
      "Simplified to local Backup & Restore (JSON) instead of CSV import/export",
      "Added a \"Clear all data\" option to reset to a fresh start",
    ],
  },
  {
    version: "3.0.0",
    date: "September 13–15, 2026",
    highlights: ["Terms, Privacy Policy, Acceptable Use, and Contact pages", "Profile photo upload"],
  },
  {
    version: "2.6.0",
    date: "September 13, 2026",
    highlights: ["Transaction details now show the running account balance"],
  },
  {
    version: "2.5.0",
    date: "September 13, 2026",
    highlights: ["Visual polish: dialog animations and backdrop blur fixed across the app"],
  },
  {
    version: "2.3.0",
    date: "September 13, 2026",
    highlights: ["Fixed scrolling inside category/icon pickers on mobile"],
  },
  {
    version: "1.0.0",
    date: "September 2026",
    highlights: [
      "Initial release: accounts, transactions, categories, and budgets",
      "Responsive dashboard for mobile and desktop",
    ],
  },
];
