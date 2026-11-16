/**
 * Routes that show the floating Add button. The reference's master spec calls
 * these out explicitly: "Home, Transactions, Budgets, Goals". Hidden on forms,
 * sheets and Settings.
 */
export const FAB_HREFS = new Set(["/dashboard", "/transactions", "/budgets", "/goals"]);

/**
 * Routes that show the mobile bottom tab bar: the FAB routes plus Settings and
 * its Preferences / Notification-settings pages, which the reference
 * (screens 08, 38, 40) shows with the bar. Every other route is a "back"
 * destination with its own header and no bottom chrome.
 */
export const TAB_BAR_HREFS = new Set([...FAB_HREFS, "/profile", "/profile/preferences", "/profile/notifications"]);
