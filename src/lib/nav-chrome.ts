/**
 * Routes that show the mobile bottom tab bar and the floating Add button.
 * The reference's master spec calls these out explicitly: "Home, Transactions,
 * Budgets, Goals" — note Transactions is included even though it isn't one of
 * the four NAV_ITEMS tabs (no tab lights up while on it, the bar is just still
 * present). Every other route is a "back" destination with its own header and
 * no bottom chrome at all.
 */
export const TAB_BAR_HREFS = new Set(["/dashboard", "/transactions", "/budgets", "/goals"]);
