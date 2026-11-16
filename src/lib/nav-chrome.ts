/**
 * Routes that show the floating "add transaction" button: only where adding a
 * transaction is the page's own job. Budgets and Goals have their own add
 * action in the header, so a green + there would be ambiguous. Hidden on forms,
 * sheets and Settings.
 */
export const FAB_HREFS = new Set(["/dashboard", "/transactions"]);

/** Routes that show the bottom tab bar but no floating button. */
const TAB_ONLY_HREFS = ["/budgets", "/goals"];

/**
 * Routes that show the mobile bottom tab bar: the FAB routes plus Settings and
 * its Preferences / Notification-settings pages, which the reference
 * (screens 08, 38, 40) shows with the bar. Every other route is a "back"
 * destination with its own header and no bottom chrome.
 */
export const TAB_BAR_HREFS = new Set([...FAB_HREFS, ...TAB_ONLY_HREFS, "/reports", "/accounts", "/profile", "/profile/preferences", "/profile/notifications"]);
