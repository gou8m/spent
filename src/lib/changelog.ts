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
    version: "3.20.0",
    date: "November 21, 2026",
    highlights: [
      "Split expenses with friends. A new Groups tab under Transactions: make a group (a trip, a flat, a dinner) with just names, add an expense and split it equally, by exact amounts, by percent or by shares. Everyone's share always adds up exactly",
      "Each group shows what you are owed or owe, who owes whom, and the fewest payments that settle everyone. Record a payment with Settle up, edit or delete any expense, archive a group when it is done",
      "Paid from your account? Only your own share counts as spending in reports and budgets, while your balance drops by what you really paid. You can also split an expense you already saved, or tick Split while adding one",
      "Loans added outside Spent: the repay-by date is now optional (no date, no column), they show in the person's chat as cards like any other loan, and names keep their capital letters in People",
      "A loan in another currency is shown at today's rate in your main currency, with its interest, and counted that way in Loans, Accounts and People",
      "Loan cards are lighter: the name, what is owed now and how much is paid. Everything else (interest, paid back, amount left, carried over) is one tap away under More details",
      "Who is it for a loan you owe: Friend, Family, Lender or Bank",
      "Email and Phone now look like your profile and birthday cards, and a shop's chat no longer shows an average and last month card",
      "Backups now include groups and shared expenses",
    ],
  },
  {
    version: "3.19.0",
    date: "November 21, 2026",
    highlights: [
      "Add an existing loan, in both directions: I owe or They owe me. Use it for money taken or given long ago, or in cash. No transaction is created and no account balance changes, and interest still counts day by day from the start date",
      "The add-loan form shows only what you need: Friend, Bank or Other appears for money you owe, the interest fields appear when interest is on, and Repay by and Currency open from their own chips. A live line shows what it comes to today",
      "Record a payment on any loan from one of your accounts, or outside Spent (cash, or someone else paid), with a preview of how it splits between interest and the amount. Payments made outside Spent can be removed, and a loan added by hand can be edited or deleted",
      "Fixed: backups did not include loans, so a restore lost them. Backups now carry loans, their payments and your People settings, and Clear all data clears loans as well",
      "People: money coming into a bank chat now says Received, not Refund (a shop's money back still says Refund). Known shops like Amazon and IRCTC are never asked about; a name that could be anything asks once: person, bank, or shop or merchant. The section reads Shops and merchants, and a blank right side replaces No spend",
      "The keyboard now eases in and out: sheets rise smoothly above it, the bottom bar and + slide away while you type, the field you tap glides into view, and everything settles back when it closes",
      "Interest fields in a new transaction open and close smoothly, and the desktop sidebar has the same row height and spacing in both groups with Add transaction in its own footer",
    ],
  },
  {
    version: "3.18.2",
    date: "November 20, 2026",
    highlights: [
      "Reports now starts with the answer: a ring showing how much you saved and what share of your income that is, then Income and Spent as two equal tiles, one line of insight, and your top categories with bars. If you spent more than you earned, it says so plainly",
      "The detailed charts (where it went, monthly spending) are still below",
    ],
  },
  {
    version: "3.18.1",
    date: "November 20, 2026",
    highlights: [
      "People now has Banks as well as People and Shops. Names like IOB, SBI, HDFC or Axis Bank are recognised as banks automatically, and a name it cannot place asks once: is this a bank or a shop? Change it any time from the chat menu",
      "Money coming back from a shop or a bank is tagged Refund, and those chats have Refund and I paid buttons",
      "The No open loans label is gone from the People list",
      "Adding a salary now offers to repeat it, with the same questions as Recurring: which day (last working day, month end or a fixed date), same amount or ask each time, and a bonus. Rent, EMI and similar bills get the same offer",
    ],
  },
  {
    version: "3.18.0",
    date: "November 20, 2026",
    highlights: [
      "Recurring items now ask the right questions for anything, not just salary: which day (same date, last day of the month or last working day), whether the amount stays the same or you want to confirm it each time, and a repeating bonus for monthly income",
      "On the due date of an item you chose to confirm (rent that now and then changes), a prompt appears: confirm the usual amount or change it",
      "A smart prompt offers your last amount when you type a title you have used before",
      "Fixed: a pending item whose date had passed stayed pending forever. Pending items now complete on their day, and an entry dated in the future waits as pending until then",
      "Fixed: the Repeat option in a new transaction added a second copy on the same day; it now carries on from next month",
      "Removed the subscription price-change alert: charges repeat at the amount you set, so there was nothing to compare",
      "Swipe sideways in a new transaction to move between Expense, Income and Transfer; Transfer shows From and To side by side and the sheet keeps the same size for all three",
      "Amounts are shown with commas as you type, grouped for the currency: 1,12,34,568.00 for rupees",
      "Settings is larger and easier to read, with Share app and Download Android app in Help; the bottom bar only slides away when a page has plenty to scroll",
      "Security: sign-in, sign-up, password reset and similar forms are rate limited, names are escaped in emails, amounts above the storage limit are refused with a clear message, and dependencies were updated",
    ],
  },
  {
    version: "3.17.0",
    date: "November 19, 2026",
    highlights: [
      "Settings fits on one screen and its bottom bar stays in place. The Birthday card in Profile now matches the profile card, with the same tile and the same edit button",
      "The Android app now carries the same version number as the website (3.17.0)",
      "The App guide under Settings now walks through every feature, from adding a transaction to Reports, Loans, People and themes",
      "The + button stops a little above the bottom edge when you scroll, instead of going all the way down",
      "Birthday and phone now show like your email once saved, with Change on the right. The birthday can be changed once; the phone any time",
      "Fixed: the Open tab bubble on Loans no longer sits misaligned after switching between I lent and I borrowed",
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
    id: "announce:faster-india",
    date: "2026-11-19",
    title: "Spent is faster, with a new home in India",
    description: "Your data moved to India. Also new: People, Calendar, themes and an app guide.",
    href: "/profile",
    icon: "sparkles",
    color: "emerald",
  },
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
