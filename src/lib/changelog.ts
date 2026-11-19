/**
 * User-facing release highlights, newest first (the About page no longer shows them; major features are
 * announced through ANNOUNCEMENTS below).
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
    version: "3.17.0",
    date: "November 19, 2026",
    highlights: [
      "Date of birth: type it with the number keypad (DD/MM/YYYY) or open a calendar where the month and the year are separate buttons that open a month grid and a year grid. The phone box also opens the number keypad",
      "The add button is a plain + again, and the new-transaction sheet rises from the bottom and grows upward as you add details",
      "The keyboard no longer opens by itself when you open the add sheet, a dialog or a picker; it appears only when you tap a field",
      "Settings: Preferences now sits under Profile (currency, theme, color theme and alerts live there), so nothing is shown twice",
      "Phone numbers use your currency's country code: type 9999999999 on INR and it is saved as +91 99999 99999, and a saved number keeps its code if you change currency later",
      "Settings is now a clean grouped list: Account (Profile, Email and phone, Password), Preferences, Data and Help, with your name, email and member-since date in one card. Birthday lives inside Profile",
      "A new default profile picture: your initial on a soft gradient that follows your color theme",
      "Fixed the new-transaction sheet: Save now sits at the very bottom in the same place for Expense, Income and Transfer, and Note, Repeat and Loan open above it instead of hiding underneath",
      "People: the list shows each name with just the latest amount, and a chat no longer shows a small picture under the back button",
      "Screens you opened a moment ago come back instantly instead of showing a loading outline",
      "Charts follow your color theme: income and expense bars change with Ocean and Graphite",
      "Spent now asks for your date of birth (it is for people aged 18 or over) and an optional phone number, in Sign up and Profile",
      "A birthday wish: a greeting on Home, a notification and an email, each year on your birthday",
      "A short first-time tour for new accounts, always available under Settings, App guide",
      "Accounts: Loans & borrowing is now simply Loans, and many long sentences across the app were shortened",
    ],
  },
  {
    version: "3.16.0",
    date: "November 19, 2026",
    highlights: [
      "People: a chat-style view of everyone you lend to, borrow from or pay. Remind gently, share a summary, mute, pin, merge two names, or mark everyone square. Gifts are never counted as money owed",
      "A lighter new-transaction sheet that asks only what matters: it offers to record a repayment, a loan or a gift when it spots a person, and keeps Save in reach",
      "The add button turns into an X while you are adding; the sheet covers the screen above it, and tapping X or outside discards the entry",
      "A new transaction now shows up in your lists the moment you save it, with no wait for the refresh",
      "Smoother forms: options open and close with a soft slide instead of popping in, including Transfer, loans, repeat and notes",
      "Settings, rebuilt: your profile card and quick links to currency, notifications, categories and security",
      "Color themes: Mint, Ocean and Graphite, in light and dark, chosen in Preferences",
      "Evened out the paired cards on Home, Accounts, Calendar and Reports so each pair is the same size",
    ],
  },
  {
    version: "3.15.0",
    date: "November 17, 2026",
    highlights: [
      "Home now greets you on mobile too (Good morning, Good afternoon, Good evening). On festival days the greeting types itself out, then types the festival wish, such as Happy Sankranthi",
      "New Calendar (in the menu): a month grid that shades heavier spending days and marks bills, loan dues, goal dates, budget ends, festivals and public holidays; tap a day to see it and add a transaction on that date; a month summary; and a 30-day Coming up list",
      "Holidays and festivals for India now run from New Year and Sankranti to Christmas, using Telugu panchangam and government holiday calendars for 2026 and 2027; moon-dependent dates are marked as possibly a day off",
      "Loans now live under Accounts: everything you lent or borrowed, open and closed, with a full history of each",
      "Interest on loans: say if you charge or pay interest and at what rate per month or year. It is worked out day by day until the loan is paid",
      "One payment can settle several loans at once, and the amount is split for you, interest first",
      "Part payments: choose to keep the rest open, stop interest, waive it, or move it to a new loan",
      "A floating bottom bar with a bubble that slides between tabs, and a Total Balance card in the same green as the add button",
      "The sliding bubble now moves across every tab and option switcher (Expense / Income / Transfer, filters, Open / Closed and more), and every big card, including the amount box on a new transaction, uses the same green as the add button",
      "Closing an edit or any sheet no longer flashes blank or empty; it slides away with what you were looking at",
      "Transaction filters, type chips and search now update the list in place, much faster, instead of reloading the whole screen",
      "Tags are no longer part of the new transaction form",
      "Smoother everywhere: account details open instantly with no jumping, screens show their own outline while loading, and content fades in when you switch tabs or views",
      "Filters now use tidy dropdowns with search for categories, tags and accounts, and budgets pick categories the same way",
      "Editing an older transaction no longer warns about a low balance; everything after it adjusts by itself",
      "Fixed: choosing an icon no longer closes the category screen behind it, and the Filter button opens reliably",
      "Fixed: the add button no longer appears on Goals and Budgets, where it opened the wrong form",
    ],
  },
  {
    version: "3.14.0",
    date: "November 16, 2026",
    highlights: [
      "A fresh Mint look across the whole app, in light and dark",
      "New bottom bar: Home, Transactions, Accounts and Settings. A menu button on Home and Settings opens Budgets, Categories, Goals, Recurring and Reports",
      "Download a PDF statement of your transactions: last month, 3 or 6 months, or any date range (Settings, Data)",
      "Home now shows your balance, cash flow, recent transactions, then goals",
      "Categories: merge, archive and restore, reorder, a detail view with trends, and one-tap standard categories",
      "Smarter category guessing from the merchant name",
      "Search now finds amounts, dates and category names",
      "The add sheet warns when an expense takes a budget past 80%",
      "Budgets show how much you can spend per day for the rest of the month",
      "Duplicate a transaction, and undo a delete from the toast",
      "Recurring shows what you commit each month, with price-change alerts",
      "Reminders now come one day ahead, and the welcome note shows only once",
      "Desktop layouts with a details panel on Transactions and bills and budgets beside Home",
      "Cleaner sign-in, sign-up and password screens, and a simpler Settings page",
      "Goals now ask which account you save in. Money that arrives there can be marked for a goal, and spending from that account warns before it uses goal money",
      "270+ searchable icons for categories and goals, including ATM, train, bus, bike and donations",
      "A real month picker on Budgets, archived budgets you can restore, and tidier spacing across the app",
    ],
  },
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

/**
 * Major new features, announced once in the notification bell. Add an entry here whenever something big
 * ships (a new screen, a new way of doing something). Each is shown for 21 days to people who already had
 * an account when it was released, until they read it (the bell remembers read ids). New sign-ups see the
 * finished app, so they are not told about "new" things.
 */
export interface Announcement {
  /** Stable forever: it is what "read" is remembered by. */
  id: string;
  /** Release day, yyyy-MM-dd. */
  date: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "announce:themes",
    date: "2026-11-19",
    title: "New: color themes",
    description: "Pick Ocean or Graphite, in light or dark. Open Preferences.",
    href: "/profile/preferences",
    icon: "sparkles",
    color: "violet",
  },
  {
    id: "announce:people-shops",
    date: "2026-11-19",
    title: "New: People",
    description: "Chat-style history with everyone you lend to, borrow from or pay. Find it under Transactions.",
    href: "/transactions",
    icon: "handshake",
    color: "violet",
  },
  {
    id: "announce:calendar",
    date: "2026-11-19",
    title: "New: Calendar",
    description: "Spending, bills, loan dues, goal dates, festivals and holidays on one calendar. Find it in the menu.",
    href: "/calendar",
    icon: "calendar",
    color: "violet",
  },
  {
    id: "announce:loans-interest",
    date: "2026-11-17",
    title: "Loans now track interest",
    description: "Lend or borrow with interest, repay several loans in one go, and see each loan's history under Accounts.",
    href: "/loans",
    icon: "handshake",
    color: "emerald",
  },
];
