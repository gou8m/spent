# Spent — Roadmap

Status snapshot as of v1.0.0. "Deep core" (auth, design system, responsive
shell, dashboard, transactions, accounts, categories, budgets) is built and
browser-tested. Everything below is scoped but not yet built.

## Requested next (from user feedback, 2026-09-15, v3.3.0 round)

- ~~**Verified badge — replaces the earlier "verified mobile number" plan.**~~
  Done. The old planned spec (phone number + OTP + SMS-provider cost) is
  scrapped entirely per explicit request — no phone field exists (see the
  earlier "Removed the phone number field" entry), and it never made sense
  attached to a field that doesn't exist. New badge instead rewards genuine
  sustained activity, per spec: `lib/verified.ts#isUserVerified` grants a
  small checkmark (`VerifiedBadge`, next to the display name in the
  `Sidebar` and on `/profile`) to any user who's logged at least one
  transaction on 20+ distinct calendar days in each of the last 6 full
  calendar months — the current, still-in-progress month never counts, so
  this can only newly turn on right after a month rolls over. The app
  owner's own account (`hellogouthamk@gmail.com`) is verified
  unconditionally, bypassing the activity check entirely, matching the
  explicit request that it "gets verified badge straight away." Computed
  live (React `cache()`-wrapped per request, nothing stored), so it can also
  silently turn back off if activity later lapses — no separate "revoke"
  path needed.
- Cash-account denomination breakdown and the cloud half of Backup dropped
  from scope this round — see their entries below (denomination removed
  outright; cloud backup's spec kept, just deferred). Multi-currency
  conversion in Reports explicitly put on hold, not declined. Accessibility
  pass, a duplicate-query performance fix, and a final visual QA sweep all
  done — see their entries further down (updated in place rather than
  duplicated here). Version bumped to **3.3.0** for this batch — Clear all
  data and the verified badge are new user-facing features, so minor rather
  than patch.

## Requested next (from user feedback, 2026-09-15, v3.2.1 round)

- ~~**Upcoming transactions — batch into a collapsed box instead of scattering
  inline.**~~ Done. The `/transactions` list previously interspersed
  `UPCOMING` rows throughout the normal date-grouped history (each flagged
  with a small clock badge), which read as clumsy clutter. `TransactionList`
  now splits `UPCOMING` out into its own collapsed `<details>` disclosure
  ("Upcoming (N)") above the regular list — click to expand, same
  `TransactionRow` rendering inside. No new dependency; a native
  `<details>/<summary>` needs no JS state of its own. The regular
  date-grouped list below now only ever shows `COMPLETED` transactions.
- ~~**Piggy-bank icon removed everywhere it was a default, wherever an
  appropriate alternative exists.**~~ Done. It was overloaded across
  unrelated concepts (Budgets nav + notifications, the SAVINGS/"Emergency
  Fund" account type, the "Emergency Fund" category, dashboard/Reports
  "Saved" stat) — replaced each with something more specific: **Budgets**
  (nav icon in both `NAV_ITEMS`/`MOBILE_MORE_ITEMS`, the budgets page empty
  state, the dashboard budget-overview empty state, the default icon for a
  newly-created budget, and the budget-alert notification icon) now use
  `calculator`; **Emergency Fund** (the `ACCOUNT_TYPES` "SAVINGS" entry, the
  `DEFAULT_EXPENSE_CATEGORIES` "Emergency Fund" category, and the QA seed
  script's fixtures) now use `gem`; the dashboard and Reports "Saved" stat
  tiles now use `coins`. `piggy-bank` stays registered in `lib/icons.ts` so
  it's still manually selectable in any icon picker — it's just no longer
  auto-assigned anywhere.
- ~~**Terms & Privacy Policy updated for Backup & Restore.**~~ Done. Both
  pages still referenced "export your transactions as a CSV from Import &
  export in Profile" — no longer accurate now that page is Backup & Restore
  only (see the v3.2.0 entry above). Updated both to describe the JSON
  backup instead, and bumped both pages' "Last updated" date to
  September 15, 2026. Acceptable Use and Contact needed no changes (neither
  referenced import/export).

## Requested next (from user feedback, 2026-09-15, v3.2.0 round)

- ~~**Import & Export page simplified to just Backup & Restore.**~~ Done.
  Per explicit request ("in this i only need backup and restore, no import
  export"), removed the CSV `ExportCard`/`ImportCard` from `/import-export`
  — the page (and its nav entries in `lib/nav.ts` and Profile) is now titled
  "Backup & restore" and shows only the `BackupCard`. The CSV export/import
  code itself (`components/import-export/export-card.tsx`,
  `import-card.tsx`, `lib/import-transactions.ts`,
  `/api/export/transactions`) is untouched and still works — it's just no
  longer linked from any page, so it's effectively dead-ended in the UI
  until/unless a future page re-links it.
- ~~**Backup — local Clear all data + confirmations.**~~ Done (2026-09-15,
  v3.3.0). Cloud (Google Drive) backup is explicitly **out of scope for
  now** per follow-up request ("not needed cloud — limit us for local now")
  — the full cloud spec is kept below as-is for whenever it's picked up, not
  deleted. What shipped this round, local-only: new
  `User.lastBackupAt`/`lastBackupFilename` columns (migration
  `add_user_last_backup_fields`), set by `/api/export/backup` on every
  download; the Backup card on `/import-export` shows a "Last backup: ..."
  line once one exists (nothing renders before the first backup — no blank/
  undefined line). New "Clear all data" card + `clearAllDataAction`/
  `clearUserData` (`lib/backup.ts`) wipes every account, category, tag,
  transaction, budget, goal, and recurring rule for the user — never the
  `User` row itself, same scope boundary backup/restore already draws. Per
  spec: no backup on file yet → warning dialog framed "No backup on file
  yet" / "Proceed anyway"; a backup **does** exist → same explicit confirm
  is still required, just reframed to name the last backup's timestamp
  instead of warning about its absence (backing up doesn't skip
  confirmation, per spec).
  - **Backup to**: local (already built — JSON download) **or cloud, not
    being built right now** (a
    dedicated app-owned Google Drive folder — confirmed feasible, and
    `drive.file` is the exact scope for it: it grants access *only* to
    files/folders the app itself creates, so "we can read/write that one
    folder and nothing else in their Drive" is enforced by Google's scope
    model, not something the app has to police itself). Requirements, for
    whenever this gets built:
    1. Enable the Drive API in the same Google Cloud project that already
       powers "Continue with Google" sign-in — no new project, no cost.
    2. Request `drive.file` (plus `access_type: offline`, `prompt: consent`
       to actually get a refresh token back) on the OAuth authorization.
    3. **Real architecture change**: persist the Google refresh token
       server-side. Today's Google sign-in uses JWT sessions with no
       database adapter, so the token is never stored anywhere — this needs
       a new field (or a proper NextAuth adapter) to hold it, plus the
       access-token-refresh logic to use it later.
    4. A "Connect Google Drive" flow **independent of login** — needed both
       for anyone who signed up with email/password (no Google token at
       all) and for existing Google-login users (their token predates the
       Drive scope; Google supports adding it later via "incremental
       authorization" without a full re-login).
    5. OAuth consent screen can stay in "Testing" mode (up to 100 named test
       accounts, no Google review) for personal/small-scale use; only needs
       formal verification if this ever opens to the general public with
       Drive access.
    6. Implementation itself is small once the above exists — a few plain
       `fetch` calls against the Drive REST API (create the folder once,
       upload a JSON file into it, list its contents for restore); doesn't
       need the full `googleapis` npm package.
  - **Restore from**: local file (already built) **or cloud, not being built
    right now** (list files in that same app-owned Drive folder and pick
    one).
  - ~~**Clear all data button**~~ — Done (2026-09-15, see above).
  - ~~Show the **last backup time and filename**~~ — Done (2026-09-15, see
    above). If cloud backups ever get built, revisit whether a single
    `User.lastBackupAt`/`lastBackupFilename` pair is still enough or a small
    dedicated table is needed to list more than one.
- ~~**Notifications — mark all as read.**~~ Done. New
  `User.readNotificationIds: String[]` (replaced wholesale, not merged, by
  "Mark all read" — so ids for a condition that's since cleared naturally
  drop out next time rather than accumulating forever).
  `getNotifications` now returns each notification's `read` state; the bell
  popover shows a "Mark all read" text link (only when something's actually
  unread, to stay out of the way otherwise) that calls
  `markNotificationsReadAction` and the unread red dot now reflects real
  unread state instead of "any notifications exist at all." Verified live:
  3 unread → click "Mark all read" → dot clears → **survives a full page
  reload** (confirming the read state is actually persisted server-side, not
  just an optimistic client-side flag).
- ~~**"Suggested" categories (frequently used first) in the transaction
  form.**~~ Done. New `getCategoryUsageCounts` (`lib/data/categories.ts`,
  a simple `groupBy` over all-time transaction counts per category) feeds
  the global "Add transaction" sheet's category lists (wired in
  `app-shell.tsx`, the one place these categories are fetched for that
  sheet). `CategoryPicker` now shows a "Suggested" section (top 6 by usage,
  only categories actually used at least once) above the existing full
  "All categories" grid, then "Custom" — exactly the
  suggested → all → custom order requested. Scoped to the expense/income
  transaction form only (not the recurring or budget category pickers,
  which weren't part of the ask and reused the same `CategoryOption` type
  without an issue since `usageCount` is optional).
- ~~**Emergency Fund — Goals/Recurring/Accounts actually linked, not just a
  name/type guess.**~~ Done — this was a real gap, not a misunderstanding:
  before this fix there was no explicit identifier anywhere tying an
  Account, a Goal, and the recurring "Emergency Fund" category together as
  the same thing. `RecurringForm`'s auto-select on choosing that category
  matched **any** `SAVINGS`-type account (`accounts.find(a => a.type ===
  "SAVINGS")`) — silently wrong the moment a user had more than one savings
  account. New `Account.isEmergencyFund` boolean (SAVINGS accounts only, at
  most one `true` per user — enforced in `actions/accounts.ts` by clearing
  every other account's flag in the same transaction as the write, not a DB
  constraint) plus a "This is my Emergency Fund" toggle in `AccountForm`
  (next to the existing "Use for daily expenses?" toggle). `RecurringForm`
  now matches `accounts.find(a => a.isEmergencyFund)` instead of the type
  heuristic. A Goal can already link to any account via its existing
  `accountId` field — no new Goal-side code needed, since pointing a
  "Emergency Fund"-named goal at the flagged account already works through
  that existing mechanism. Verified live: toggled it on for a test SAVINGS
  account, then confirmed the recurring form's account picker switched from
  its normal default (Bank) to that exact account the moment the
  "Emergency Fund" category was chosen.
- ~~**Credit card overpayment — "owed" showed 0 instead of going
  negative.**~~ Done — real bug, confirmed and reproduced before fixing.
  `AccountDetails` computed `used = Math.max(0, -account.balance)` — correct
  while in debt, but the `Math.max(0, ...)` silently clamped away the
  overpayment once a payment larger than the balance owed pushed
  `account.balance` positive (a credit in the user's favor). Removed the
  clamp on the underlying `used` value (so "Balance owed" and "Available
  credit" show the true signed figure, e.g. **-₹100.00** for a ₹100 credit
  balance) while still clamping only the *progress bar's* fill percentage to
  0–100% (a bar can't visually show negative/over-100% fill, but the number
  next to it isn't lying anymore). Verified live end-to-end: seeded a
  ₹100-owed credit card, paid ₹200 against it via a transfer, confirmed
  "Balance owed" read **-₹100.00** and "Available credit" read
  **₹50,100.00** (exceeding the ₹50,000 limit, correctly reflecting the
  credit).
- ~~**Notification prefs — replace inline description text with an (i)
  button.**~~ Done, per request to keep the page minimal. Each row in
  `NotificationPrefs` (Upcoming bills / Budget alerts / Goal milestones) no
  longer shows its explanation as permanent caption text under the label;
  it's now a small (i) icon button next to the label (same `Popover`-based
  pattern as `CurrencyInfo` elsewhere in Profile) that reveals the
  explanation on demand.
- ~~**Calendar — year navigation, not just month-by-month.**~~ Done. The
  custom `DatePicker` (`components/ui/date-picker.tsx`) gained a second
  "month" view: clicking the "Month Year" header (instead of just displaying
  it) swaps to a 12-month grid for the current year, and the same < > arrows
  that stepped by month now step by year while in that view; picking a
  month drops back into the normal day grid. No third "decade" view — one
  extra tap to reach any month/year was judged enough, given "keep the UI
  minimal."
- **Version tagging convention, going forward.** Per request, `package.json`
  gets a semver bump (major/minor/patch, judged by what actually shipped)
  each time a batch of work like this lands, then pushed to GitHub —
  `Profile`'s About card already reads `APP_VERSION` live from
  `package.json` (see the "Settings depth" entry above), so no separate
  edit is needed there.
## Requested next (from user feedback, 2026-09-13, v2.6.0 round)

- ~~**Transaction row "Bal" label removed, balance moved to details view.**~~
  Done. The per-row secondary line under a transaction's amount now shows
  the running balance amount alone (no "Bal" prefix). Opening a
  transaction's details view now has its own **Balance** row, placed in
  sensible order — Category, Account, **Balance**, Date (or From account,
  To account, Converted to, **Balance**, Date for a transfer). Required a
  small plumbing change: `getTransactionById` (`lib/data/transactions.ts`)
  now also computes the transaction's running balance via
  `getRunningBalances` (only for `COMPLETED` transactions — an `UPCOMING`
  one has no real balance to show, same rule the list already followed) and
  attaches it to the record it returns, which `TransactionDetails` reads
  directly rather than needing it threaded in as a separate prop.

## Requested next (from user feedback, 2026-09-13, v2.5.0 round)

- ~~**Centered dialogs animating in from off-screen left.**~~ Done — a real
  bug, confirmed by instrumenting the animation frame-by-frame rather than
  guessing. Tailwind's `-translate-x-1/2 -translate-y-1/2` utilities compile
  to the modern standalone CSS `translate` property, not `transform:
  translate(...)`. The `sheet-scale-in`/`sheet-scale-out` keyframes were
  separately setting `transform: translate(-50%, ...) scale(...)` — and
  `translate`/`scale` (standalone) compose *together* with `transform`
  rather than one overriding the other, so the centering offset was being
  applied twice for the animation's duration, throwing every centered
  dialog (name edit, email change, password change, confirm dialogs, and
  the desktop-width `Sheet`) far off-screen left until the animation ended
  and it snapped into place. Fixed by having the keyframes animate only the
  standalone `scale` (+ opacity), leaving the existing `translate` alone —
  verified by measuring the dialog's center position at multiple points
  during a slowed-down animation and confirming zero deviation from the
  viewport center throughout.
- ~~**Backdrop blur while a dialog is open.**~~ Done. Every dialog/sheet
  overlay (`Sheet`, `ConfirmDialog`, `ChangePasswordDialog`, `EmailSection`,
  `ProfileForm`'s edit dialog, `ContributeDialog`) now has `backdrop-blur-sm`
  alongside the existing dark tint, for the entire time it's open — it
  wasn't blurring the background at all before, just dimming it.
- ~~**Login/register page's legal notice wrapping to 3 lines.**~~ Done. The
  separately-added "Contact us" paragraph (from the earlier round) sat
  below `LegalNotice` as its own block, adding a 3rd line under the 2 the
  sentence itself already wraps to. Folded "Contact us" into the same
  `LegalNotice` paragraph instead ("...Privacy Policy. Questions? Contact
  us.") so it wraps as part of the same flowing text rather than adding an
  extra line — same component used by both login and register.
- ~~**"Forgot password?" inside Change Password bounced to /dashboard.**~~
  Done — real routing bug. `/forgot-password` was in `proxy.ts`'s
  `PUBLIC_PATHS`, which bounces already-logged-in users to `/dashboard` —
  fine for `/login`/`/register` (a logged-in user visiting those makes no
  sense), wrong here, since the whole point of that link is for a
  logged-in user who forgot their *current* password mid-"Change password"
  to reach it. Moved `/forgot-password` and `/reset-password` to
  `ALWAYS_ACCESSIBLE_PATHS` instead (accessible logged out, never bounces a
  logged-in visitor away) — verified the link now actually lands on
  `/forgot-password` instead of redirecting back.

## Requested next (from user feedback, 2026-09-13, v2.3.0 round)

- ~~**Scroll-up bug — actually fixed this time.**~~ Done. The v2.2.0
  "fix" (`overscroll-contain`) addressed scroll-chaining but missed the
  real cause, as a real-device screenshot showed: a scrollbar thumb was
  visible (so `overflow-y-auto` was working) but touch-dragging did
  nothing. Root cause, confirmed against [a documented Radix issue](https://github.com/radix-ui/primitives/issues/1159):
  our `CategoryPicker`/`IconColorPicker` popovers (and any `Select`) portal
  their content to `document.body` by default — which, when opened from
  inside a `Sheet`, lands *outside* the Dialog's own DOM subtree.
  `react-remove-scroll` (which the modal Dialog uses to lock background
  scroll while open) can't tell that content apart from actual page
  content behind the sheet, so it blocks touch-scroll on it too. Fixed by
  giving `Sheet` a `SheetPortalContext` exposing its own content node, and
  having `PopoverContent`/`SelectContent` portal into that instead of
  `document.body` whenever they're opened from inside a Sheet (falls back
  to `document.body` normally, so nothing changes for pickers used outside
  a Sheet). Verified for real this time — not just checking CSS classes,
  but dispatching genuine CDP touch events (`touchstart`/`touchmove`/
  `touchend`) against both reported cases (the transaction form's category
  picker, and the category page's icon/color picker) and confirming
  `scrollTop` actually moves.

## Requested next (from user feedback, 2026-09-13, v2.2.1 round)

- ~~**Profile page's legal footer — drop the signup framing.**~~ Done. The
  bottom of Profile showed the same `LegalNotice` used at signup ("By
  signing up, you agree to..."), which reads oddly for someone already
  signed up. Left `LegalNotice` itself untouched (still used as-is on
  login/register) and added a new `ProfileLegalLinks` component just for
  Profile: a plain, centered, dot-separated row — "Terms · Acceptable Use ·
  Privacy Policy · Contact us" — no consent wording.
- ~~**Removed the standalone "Contact us" row above Sign out.**~~ Done —
  redundant now that it's in the footer link row above. Sign out is back to
  being the only item in the "Account" card, and its button content is now
  centered (was left-aligned) rather than repositioning the card itself.

## Requested next (from user feedback, 2026-09-13, v2.2.0 round)

- ~~**Scroll-up not working inside nested pickers (category picker, category
  creation's icon/color picker).**~~ Done. Classic nested-scroll-container
  bug: once an inner scrollable list (the icon grid, category grid, budget's
  category grid, the import preview list, a `Select`'s option list, or a
  `Sheet`'s own body) hit its own scroll boundary, the scroll gesture
  chained up to whatever scrollable ancestor was behind it, and reversing
  direction afterward could get "stuck" on the wrong element. Fixed
  generically with `overscroll-behavior: contain` (Tailwind
  `overscroll-contain`) on every nested scrollable region — this is the
  standard fix for this exact class of bug and needed no per-page special
  casing.
- ~~**Profile pencil moved off the name, onto the card.**~~ Done. The small
  inline pencil next to the display name felt cramped and easy to miss;
  moved to a proper icon button on the right edge of the profile card
  (avatar — name/email, grows — edit button, a clean 3-zone row, matching
  how account/transaction rows already put their action on the right).
  Swapped `Pencil` for `SquarePen` so it reads as a distinct "edit profile"
  affordance rather than reusing the exact glyph already used for editing
  accounts/transactions/categories elsewhere.
- ~~**Buttons with invisible/poor background contrast (the outline
  variant).**~~ Done — real, systemic bug, not just the one "Change" button
  reported. `Button`'s `outline` variant was `bg-surface` with **no
  border**, so on any dialog/card that's *also* `bg-surface` (nearly all of
  them — `ConfirmDialog`, `ChangePasswordDialog`, `EmailSection`,
  `ProfileForm`'s edit dialog, account/budget/goal forms' Discard buttons,
  etc.), the button was indistinguishable from its background — only a
  faint `shadow-xs` hinted it was clickable. Fixed at the source: `outline`
  now has an actual `border border-border-strong`, so it's visibly a button
  everywhere it's used (13 files) without touching each call site
  individually.

## Requested next (from user feedback, 2026-09-13, legal pages round)

- ~~**Real Terms, Privacy Policy, Acceptable Use, and a Contact Us page.**~~
  Done — replaces the earlier "placeholder, not finalized" pages. Written to
  describe what this app *actually* does and collects, nothing generic
  bolted on: no bank-linking (everything is manually entered or CSV-
  imported), no analytics/ad trackers (verified — nothing in
  `package.json` beyond the app's own dependencies), and named the real
  sub-processors this app uses (Supabase, Vercel + Vercel Blob, Resend,
  Google for OAuth, Frankfurter for exchange-rate lookups by currency code
  only). Privacy Policy explains export (CSV, self-serve, already built) vs.
  delete (email-based, since there's no self-serve delete-account flow
  yet — flagged honestly as manual). New `/contact` page (mailto to
  `SUPPORT_EMAIL`, i.e. `help@spentonline.in`), linked from a new shared
  `LegalPageFooter` (cross-navigation between all four pages), Profile's
  "Account" section, and under the legal notice on login/register.
  **Caveat, stated on the record**: this is AI-drafted based on the app's
  actual code and data model, not lawyer-reviewed — reasonable for a small
  personal-finance side project, but get real legal review before treating
  it as sufficient for GDPR/CCPA-level compliance if this ever takes on
  paying users or scales meaningfully. `/contact` added to `proxy.ts`'s
  always-accessible paths (reachable logged out, doesn't bounce a logged-in
  visitor away). Verified live: all four pages render with zero console
  errors, cross-nav footer links work.

## Requested next (from user feedback, 2026-09-13, production QA round)

- ~~**Profile name editing — pencil + dialog instead of an always-visible form.**~~
  Done. `ProfileForm` no longer shows a persistent name input + "Save
  changes" button; a small pencil icon next to the display name opens a
  small dialog (name field + Save/Cancel) via `updateNameAction`. Split
  cleanly out of the old combined `updateProfileAction` (which bundled name
  + avatar into one submit) since avatar changes are now independent too
  (see profile photo upload, below).
- ~~**Profile photo upload.**~~ Done. New `@vercel/blob`-backed
  `uploadAvatarAction` (5MB cap, JPG/PNG/WEBP/GIF only) alongside the
  existing preset-icon picker — `AvatarPicker`'s popover now has an "Upload
  a photo" button above the preset grid. `User.avatar` stores either a
  preset id (`avatar-3`) or an uploaded photo's URL; new
  `lib/avatars.ts#isPresetAvatar` tells them apart, and a new shared
  `UserAvatar` component (replacing raw `IconChip`+`getAvatarPreset` calls
  in the sidebar/mobile header/avatar picker) renders whichever kind it is.
  **Requires setup**: create a Blob store in the Vercel dashboard (Storage →
  Create Database → Blob) — it auto-injects `BLOB_READ_WRITE_TOKEN` into
  Production/Preview env vars. Without that token set, uploading shows a
  clear "Photo uploads aren't set up yet" error rather than failing
  silently or crashing; preset icons are unaffected either way.
- ~~**Mobile "More" sheet — visual redesign.**~~ Done. Replaced the 3×2 grid
  of bare circles with 2-column pill rows (icon chip + label side by side)
  — reads better for longer labels like "Import & export" than a tiny
  centered caption under a circle. Removed the sheet's title text and close
  (X) button per request — tapping outside (the existing default overlay
  click-to-close) is now the only way to dismiss it, alongside picking a
  destination. New `Sheet` prop `hideHeader` (visually hides the title row
  but keeps an `sr-only` `Dialog.Title` for screen readers, since Radix
  requires one) — added generically to the shared `Sheet` component,
  defaulting to `false` so every other sheet (transactions, accounts,
  budgets, goals, recurring) is unaffected.
- ~~**Glossy/glass finish removed from the bottom nav.**~~ Done. Bottom nav
  bar switched from `glass` (backdrop-blur) to solid `bg-surface`, matching
  how popovers/dropdowns/selects already work — glass is now reserved for
  the desktop sidebar and mobile top header only, per request.
- ~~**Credit cards excluded from balance totals.**~~ Done. A credit card is a
  liability, not held money — including one in "Total balance" or the
  dashboard's "Other balances" row would overstate what the user actually
  has. `getDashboardData`'s two balance sums now both filter out
  `type === "CREDIT_CARD"`; individual credit card accounts still show
  their own balance everywhere else (Accounts page, Accounts Strip) — this
  only changes what counts toward the aggregate figures.
- ~~**Category picker — names not fitting.**~~ Done. Both the transaction
  form's category picker and the budget form's category grid went from a
  4-column (transactions) / `line-clamp-1` layout to 3 columns with
  `line-clamp-2` — long names like "Entertainment" or "Gifts & Donations"
  now wrap onto a second line instead of getting cut off mid-word.
- ~~**Missing default categories.**~~ Done. Added Self Care, Fitness, Pets,
  Insurance, Kids & Family, and Gifts & Donations to
  `DEFAULT_EXPENSE_CATEGORIES` (seeded for new signups only — doesn't
  retroactively add to existing accounts, consistent with how category
  seeding has always worked).
- ~~**Long account/category names overflowing their picker buttons.**~~ Done
  — real CSS bug, not just a content-length issue. Root cause: Radix's
  `SelectValue` portals the selected item's rendered content directly into
  its own unstyleable `<span>` (passing it a `className` is silently
  dropped by Radix), and that span had no `min-width: 0`, so flexbox's
  default `min-width: auto` blocked the inner text from ever shrinking
  enough to truncate — the pill's `overflow-hidden` was just hard-clipping
  it instead of a clean ellipsis. Fixed generically in the shared
  `SelectTrigger` with a `[&>span]:min-w-0 [&>span]:flex-1` child selector
  targeting that exact span, plus matching `min-w-0`/`flex-1`/`truncate` on
  `AccountPicker`'s rendered row. Fixes every `Select` in the app that can
  hit this, not just the account picker.
- ~~**Export/Import icons swapped.**~~ Done, per request — `ExportCard` now
  uses an upload-style arrow, `ImportCard` a download-style one (the
  reverse of before).
- ~~**Transaction list — redundant per-row date removed.**~~ Done. The
  `/transactions` list already groups rows under "Today" / "Yesterday" /
  full-date headers, and opening a transaction's details already shows its
  date — the per-row "MMM d" under the amount was a third, redundant copy.
  Removed; the running-balance text (when present) is now the row's only
  secondary line.
- ~~**Dashboard greeting used the server's clock, not the visitor's.**~~
  Done — real bug, not just a nice-to-have. The greeting was computed in a
  Server Component (`new Date().getHours()`), which reads wherever the
  server happens to be running (a different timezone than the visitor in
  general, and specifically true here since the DB/functions are pinned to
  Seoul). New client `Greeting` component computes it from the *browser's*
  local time instead, using the same hydration-safe `useSyncExternalStore`
  mount-detection pattern as `ThemeToggle` (renders a neutral "Hello" for
  the first paint, swaps in the real greeting once mounted — avoids both a
  hydration mismatch and the `react-hooks/set-state-in-effect` lint error a
  naive `useEffect` + `setState` would trigger).

## Requested next (from user feedback, 2026-09-13, perf round)

- ~~**"Big delay after click" — Vercel/Supabase region mismatch.**~~ Done.
  Root cause: Vercel Functions default to `iad1` (Washington, D.C.) for
  every new project, but this app's Supabase database is in `ap-northeast-2`
  (Seoul). Every request was paying full US↔Asia round-trip latency on top
  of the query itself — exactly matching the multi-second page loads logged
  throughout this session. New `vercel.json` pins function execution to
  `icn1` (Seoul, Vercel's region code for `ap-northeast-2`) to co-locate
  compute with the data — works on the free Hobby plan too (single-region
  only; Pro allows up to 5). This won't speed up *local* dev (this machine's
  physical distance from Seoul doesn't change), only production once
  deployed.
- ~~**Redundant per-request user query.**~~ Done, same investigation. Several
  pages (`dashboard`, `budgets`, `goals`, `profile`, `reports`) each
  independently fetched the current user row, on top of `app-shell.tsx`
  already fetching it for the sidebar/header — two round-trips to the same
  row on every single page load. New `lib/data/user.ts` (`getCurrentUser`,
  wrapped in React's `cache()`) de-dupes that down to one query per request
  regardless of how many components need the user. Small win in absolute
  terms, but every eliminated round-trip matters more than usual given the
  cross-region latency above.

## Requested next (from user feedback, 2026-09-13, later round)

- ~~**Mobile bottom nav — replace Budgets with a "More" grid.**~~ Done. The
  bottom nav's 4th slot (previously Budgets) is now "More", opening a
  bottom sheet with a 3×2 icon grid (Budgets, Goals, Recurring, Reports,
  Import & export, Profile — Profile deliberately last, per reference)
  instead of competing for a limited number of icon slots. Home,
  Transactions, and Accounts remain directly on the bar.
  `lib/nav.ts` now exports `MOBILE_PRIMARY_ITEMS` (3 items) and
  `MOBILE_MORE_ITEMS` (the 6-item grid) instead of the old flat
  `MOBILE_NAV_ITEMS`.
- ~~**Change-password dialog cleanup.**~~ Done. Removed the "Enter your
  current password, then choose a new one." description text; added a
  "Forgot password?" link next to the Current password field, for anyone
  who can't complete this form because they don't remember their *current*
  password (routes to `/forgot-password`'s email-link flow instead).
- ~~**Password policy.**~~ Done. New shared `lib/validations/password.ts`
  (`passwordSchema`) requires 8+ characters plus at least one uppercase,
  one lowercase, one number, and one symbol — applied to every *newly
  chosen* password (signup, reset-password, change-password's new-password
  field). Deliberately not applied to a "current password" field (verifying
  an existing password, which may predate this policy). Register/reset/
  change-password fields now show a persistent hint ("Uppercase, lowercase,
  a number, and a symbol.") that's replaced by the specific validation
  error once one fires.
- ~~**Removed the phone number field.**~~ Done — reverted the earlier
  addition per request. Deleted `PhoneField`, `updatePhoneAction`,
  `phoneSchema`, and the `User.phone` column (migration
  `remove_user_phone`; the one real non-null value on the account was
  cleared first since Prisma's destructive-migration confirmation prompt
  doesn't work in a non-interactive shell).

## Requested next (from user feedback, 2026-09-13)

- ~~**Change email (with verification) + optional phone number + change password
  (with current-password check), all in Profile.**~~ Done. New "Account &
  security" card on `/profile`, between Finance and Appearance:
  - **Email**: shows the current address; "Change" opens a dialog for a new
    one, which — mirroring signup's flow — emails a 24h verification link
    (new `EmailChangeToken` model, `lib/email-change.ts`,
    `sendEmailChangeVerification` in `lib/email.ts`) to the *new* address
    rather than applying the change immediately. `User.pendingEmail` tracks
    the awaited address and shows a banner with a "cancel" link
    (`cancelEmailChangeAction`) until the link is clicked or cancelled;
    clicking "Change" again while pending pre-fills and resends. New public
    route `/verify-email-change?token=` (added to `proxy.ts`'s always-
    accessible list) swaps `email` for `pendingEmail`, re-marks
    `emailVerified`, and re-checks the address isn't now taken by someone
    else before committing. Same disposable-email blocklist as signup
    applies to the new address.
  - **Phone number**: plain optional `User.phone` field, inline input +
    Save. No verification, no SMS/2FA use — just a contact-info field.
    (Later removed — see "Removed the phone number field" above.)
  - **Change password**: new dialog requires the *current* password
    (`bcrypt.compare` against `passwordHash`) before accepting a new one —
    matches how every other app does this; wrong current password shows
    "Current password is incorrect" without touching anything.
  - Factored the register/reset-password `getOrigin()` helper out of
    `actions/auth.ts` into `lib/origin.ts` so `actions/profile.ts` could
    reuse it for the email-change link too.
  - Verified end-to-end with a scripted browser run (register → verify →
    log in → set phone, reload, confirm persisted → wrong current password
    rejected → correct current password accepted → log out/in with the new
    password to prove it actually took → request email change → confirm via
    the emailed link → log in with the new email to prove that took too).
    Resend's sandbox restriction (see below) means the verification email
    itself couldn't be *delivered* to a non-owner test address during this
    run, same as every other email in this app right now — but the
    `pendingEmail`/token are written *before* the send attempt (same
    create-then-send order as `registerAction`), so the flow is fully
    functional and just needs a verified sending domain to actually land in
    someone's inbox.
- ~~**Native browser chrome breaking the design system.**~~ Done. Two spots
  were using unstyleable native browser UI instead of the app's own
  components: (1) the Sign out button (and the theme toggle's Light/Dark/
  System buttons) used the native `title=` attribute, which renders as a
  plain OS tooltip — replaced with a proper `Tooltip` component
  (`src/components/ui/tooltip.tsx`, wraps `@radix-ui/react-tooltip`, already
  a dependency but unused until now; `TooltipProvider` added once in the
  root layout); (2) the register page's currency field was a raw HTML
  `<select>` — its trigger could be styled but the opened dropdown list
  can't be (browser-native, no CSS access) — swapped for the app's own
  `Select` component (same one used everywhere else), wired through
  react-hook-form via `Controller` since Radix Select isn't a native form
  element `register()` can attach to directly.
- ~~**Password visibility toggle.**~~ Done. New `PasswordInput` component
  (`src/components/ui/password-input.tsx`, wraps `Input` with an eye/eye-off
  toggle button) — swapped in on login, register, and both reset-password
  fields.

- ~~**Resend sandbox restriction — verify a domain to email real users.**~~
  Done (2026-09-13). Domain `spentonline.in` verified at resend.com/domains
  (DNS mapped by the user). Real delivery confirmed end-to-end using
  Resend's own `delivered@resend.dev` test address (their designated
  address for simulating a successful delivery — plain `@example.com`
  addresses are *permanently* rejected by Resend regardless of domain
  verification, as an anti-mistake guard, so that's not a valid way to
  test this).
- ~~**Purpose-specific sender addresses + reply-to + redesigned templates.**~~
  Done (2026-09-13), follow-up to the domain verification above. Verifying
  one domain with Resend covers every local part at it, no extra DNS per
  address — so: `welcome@spentonline.in` sends the signup verification
  email, `noreply@spentonline.in` sends password-reset and email-change
  verification (`EMAIL_FROM_WELCOME` / `EMAIL_FROM_NOREPLY` in `.env`, each
  falling back to `EMAIL_FROM` then the sandbox sender if unset); every
  transactional email also sets `EMAIL_REPLY_TO="help@spentonline.in"` so a
  reply to a "noreply" sender still reaches an inbox instead of bouncing.
  `SUPPORT_EMAIL` (the currency-cap "Contact us" link) now points at
  `help@spentonline.in` too, replacing the personal-email placeholder.
  **Caveat, not yet resolved**: Resend's domain verification (SPF/DKIM) only
  proves the domain can *send* mail — `help@spentonline.in` needs actual
  inbound routing (MX records + a real mailbox, e.g. Cloudflare Email
  Routing forwarding it to a personal inbox, or a proper mailbox provider)
  before replies or the "Contact us" mailto link will actually reach
  anyone. Verify that separately. New shared `lib/email-layout.ts` renders
  every email inside a consistent branded shell (violet "S" mark, rounded
  card, matches the app's light-mode Nocturne palette — hardcoded hex, not
  CSS variables, since most email clients strip `<style>`/custom properties)
  instead of each function repeating its own inline markup.
- ~~**Fixed: email-send failures were silently swallowed.**~~ Done. Found
  while diagnosing the above — `resend.emails.send()` doesn't throw on a
  rejected send, it returns `{ data: null, error }`; `lib/email.ts` wasn't
  checking that, so the app kept reporting "email sent" / "check your
  inbox" even when Resend had rejected it outright. Both send functions now
  throw when `error` is present — and, matching the existing "no API key"
  fallback, also `console.warn`s the raw link before throwing, so a failed
  send (like the sandbox restriction above) doesn't block local testing —
  grab the link from the server log and continue manually. `registerAction`
  and `resendVerificationEmailAction` surface the real failure to the user
  too (no enumeration concern — the user is submitting their own address).
  `requestPasswordResetAction` intentionally still swallows the failure
  from the user's perspective (logged server-side only) — surfacing it
  in the UI would reveal whether the
  account exists, since that branch only runs when it does, defeating the
  point of its "always return success" contract.

- ~~**Forgot password.**~~ Done. New `PasswordResetToken` model (separate
  from `EmailVerificationToken` — a reset token gets a much shorter, 1-hour
  expiry, `lib/password-reset.ts`) plus `/forgot-password` (request a link)
  and `/reset-password?token=` (choose a new password) pages, "Forgot
  password?" link added next to the password field on `/login`.
  `requestPasswordResetAction` always returns success whether or not the
  email is registered — revealing that would let someone enumerate accounts
  by testing addresses against the form. `RESEND_API_KEY` is now set, so
  this (and email verification) sends real email rather than just logging
  the link to the server console.
- ~~**"Contact us" fallback once the currency-change cap is hit.**~~ Done.
  The (i) info popover on Profile's Currency row now adds a "Contact us"
  mailto link once `remaining === 0`. No dedicated support address exists
  yet, so it defaults to the account owner's own email
  (`SUPPORT_EMAIL` in `lib/constants.ts`) — swap that constant for a real
  support address (e.g. `support@yourdomain.com`) once you have one.

- ~~**Currency-change UX fixes.**~~ Done, in response to feedback on the
  currency selector above: (1) the "X left" counter sat next to the dropdown
  — moved it to a caption under the "Primary currency" label, then per
  follow-up feedback replaced entirely: label is now just "Currency" with an
  (i) info button (`CurrencyInfo`, reuses the existing `Popover` primitive
  for UI consistency) that explains the current currency and changes
  remaining on demand, instead of always-visible text; (2) picking a new
  currency requires confirmation via a new reusable `ConfirmDialog`
  (`src/components/ui/confirm-dialog.tsx`) showing "You have N changes left"
  before committing — Cancel leaves the dropdown showing the old value
  (nothing applied optimistically), Proceed calls `updateCurrencyAction`.
- ~~**Accounts click behavior — match the transaction pattern.**~~ Done.
  Clicking an account now opens a read-only `AccountDetails` view first
  (type, currency, starting balance) with **Edit account** (primary) and
  **Archive/Unarchive** + **Delete** (Delete double-confirms, same as
  transactions) instead of jumping straight to the edit form via a "..."
  dropdown. `AccountCard` is now a plain clickable row (dropdown removed —
  its actions live in the details view now); `AccountForm` gained a
  **Discard** button that returns to the details view without saving,
  mirroring `TransactionForm`.
- ~~**Multi-currency dashboard display.**~~ Done. `getDashboardData` already
  computed `otherCurrencyAccounts` but nothing rendered it. Added
  `otherBalances` (accounts grouped and summed by currency, so two INR
  accounts become one line) and a small "Other balances" row under the
  primary Total Balance on the dashboard, each showing the amount in its
  own currency plus the currency code for disambiguation (e.g. "$" alone is
  ambiguous between USD/CAD/AUD). Primary total is unaffected — still only
  sums accounts matching the user's primary currency, same as before.

- ~~**Primary currency selection for Google OAuth signups + general currency
  changes.**~~ Done. OAuth signups skip the registration form (no chance to
  pick a currency, so they defaulted to USD) — rather than build a separate
  one-time onboarding prompt, gave everyone a "change primary currency"
  control in Profile (`CurrencySelector`), capped at `MAX_CURRENCY_CHANGES`
  (3, `lib/constants.ts`) lifetime changes tracked via new
  `User.currencyChangeCount`. This one control covers both asks: OAuth users
  use it to set their real currency for the first time, and it's also the
  general "change primary currency" capability. Changing it doesn't touch
  existing accounts/transactions (each already keeps its own currency
  correctly) — it only changes which accounts count toward the dashboard's
  headline total balance, consistent with how that total was already
  computed.

- ~~**Google OAuth sign-in.**~~ Done. `auth.ts` adds a `Google` provider
  (needs `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` in `.env` — see the comment
  there for how to create the OAuth client). No adapter is configured (JWT
  sessions don't need one), so the `jwt` callback does its own lookup-or-
  create-by-email on first Google sign-in, seeding the same default
  categories/Cash-account as a normal signup (`lib/onboard-user.ts`,
  factored out of `registerAction` for reuse). Google-verified emails
  (`profile.email_verified`) are marked verified immediately, skipping the
  email-confirmation step below. `GoogleButton` component + a
  `signInWithGoogleAction` form action on both login and register pages.
- ~~**Email verification at signup + no dummy emails.**~~ Done. New
  `EmailVerificationToken` model + `User.emailVerified`. `registerAction` no
  longer auto-signs-in — it emails a 24h verification link
  (`lib/email-verification.ts` → `lib/email.ts`, via Resend; needs
  `RESEND_API_KEY` in `.env` — without it, the link is just logged to the
  server console, so the flow is testable without a real email account) and
  the register page shows a "check your email" screen with a resend option.
  `authorize()` in `auth.ts` throws a custom `EmailNotVerifiedError` (a
  `CredentialsSignin` subclass) if the password is right but the email
  isn't verified yet; the login page catches it and offers to resend. New
  `/verify-email` page (public route, added to `proxy.ts`'s always-
  accessible list). "No dummy mails" enforced two ways: a disposable-email
  domain blocklist (`lib/disposable-email-domains.ts`, checked in
  `registerSchema` — not exhaustive, new disposable domains appear
  constantly) plus the verification requirement itself (you can't activate
  an account you can't receive mail at). Verified end-to-end with a real
  browser flow (register → blocked login → click link → login succeeds);
  Google OAuth and real email delivery need your actual credentials in
  `.env` to test live.
- ~~**Cross-currency transfers (e.g. USD → INR).**~~ Done. Added
  `Transaction.transferToAmount` (minor units credited to the destination
  account, in ITS currency; null means same amount/currency as before —
  fully backward compatible). `lib/exchange-rates.ts` fetches live rates
  from Frankfurter (ECB-sourced, free, no API key) to pre-fill the "X
  receives" field on the transfer form when the two accounts' currencies
  differ — the user can always override the fetched value. `getAccountBalances`
  and `getRunningBalances` (`lib/balances.ts`) now credit the destination
  account with `transferToAmount ?? amount` instead of always assuming same-
  currency. Transaction details view shows the converted amount for such
  transfers. Note: creating an account in a non-primary currency was
  already supported before this (see `account-form.tsx`'s currency select)
  — this piece specifically added is the conversion on transfer between
  differently-curried accounts.
- ~~**Legal notice + placeholder legal pages.**~~ Done. Added a
  `LegalNotice` component ("By signing up, you agree to our Terms,
  Acceptable Use, and Privacy Policy.") to the login, register, and profile
  pages, linking to new `/terms`, `/acceptable-use`, `/privacy` pages.
  These are explicitly placeholder content, not real legal text — I'm not
  qualified to draft binding legal policy, and fabricating something that
  reads as authoritative would be worse than an honest placeholder. Get
  these reviewed/written properly before relying on them for anything real.

## Requested next (from user feedback, 2026-09-12)

- **Visual redesign — new aesthetic direction.** Code-complete (2026-09-13),
  live QA still pending. User supplied a reference image (dark pill-shaped
  fintech UI) plus a detailed written structural spec — pill shapes
  everywhere, no hard borders (shadows/tone shifts instead), massive
  high-contrast balance typography, rounded bar-chart columns, floating
  glassmorphism nav, circular-icon transaction rows. Explicit instruction:
  do NOT copy the reference's dark/yellow palette — designed a new
  "Nocturne" palette instead (near-monochrome base + one vivid violet
  accent, both light and dark modes) in `src/app/globals.css`. Applied
  across core UI primitives, layout/nav, dashboard hero, and the cash-flow
  chart (converted from an area chart to rounded pill bars). Verified via
  screenshot on the public login/register pages (zero console errors);
  the authenticated pages (dashboard/transactions/profile) are implemented
  but not yet screenshot-verified live — Supabase connection-pool
  exhaustion (see below) blocked that pass. Still to do: a final pixel-QA
  pass across every remaining page/state once the DB issue is confirmed
  clear.
- **Fixed: Supabase connection-pool exhaustion (2026-09-13).** Root cause
  of the login failures today — a same-day fix (`auth.ts` session callback
  re-verifying the user exists in the DB) ran on nearly every request via
  `proxy.ts` and exhausted Prisma's connection pool ("Timed out fetching a
  new connection... connection limit: 21"), which surfaced as intermittent
  "CredentialsSignin" errors that looked like wrong passwords. Reverted the
  per-request DB check; `app-shell.tsx`'s existing user lookup (which was
  already needed for name/email/avatar) still redirects to `/login`
  defensively if the session's user no longer exists, at no extra query
  cost. If login trouble recurs, check for `Timed out fetching a new
  connection from the connection pool` in the dev server log first.
- ~~**New font pairing (numbers).**~~ Done (2026-09-13), iterated twice.
  First pass swapped Geist Mono for Space Grotesk (user disliked Mono's
  blocky look). User then specifically asked for SF Pro — not distributable
  as a bundled web font (Apple restricts it to Apple platforms), so
  `.font-numeric` now leads with `-apple-system, BlinkMacSystemFont` (real
  SF Pro on Mac/iOS) and falls back to Inter (`--font-numeric` in
  `src/app/layout.tsx`, near-identical shape, excellent tabular figures)
  everywhere else. Weight already varies bold/normal by context via
  `Amount`'s existing size classes (700/600/500). Body text (Plus Jakarta
  Sans) unchanged.
- ~~**Balance-card arrow directions.**~~ Done (2026-09-13): Income used
  `ArrowUpRight` and Expenses `ArrowDownRight` — both read as "outward" to
  the user. Swapped to `ArrowDownLeft` for Income (money arriving) and
  `ArrowUpRight` for Expenses (money leaving), matching the common
  incoming/outgoing icon convention (`balance-card.tsx`).
- ~~**Redesign follow-up fixes (2026-09-13).**~~ From user screenshots of the
  Add Transaction sheet: (1) native browser `<input type="date">` calendar
  clashed with the app UI — built a custom pill-styled `DatePicker`
  (`src/components/ui/date-picker.tsx`, Popover + date-fns) and swapped it
  into the transaction and budget forms; (2) the category-picker popover's
  glassmorphism background let the page behind show through and hurt
  legibility — glass is now reserved for the floating nav only (sidebar/
  mobile header/bottom nav), popovers/dropdowns/selects went back to solid
  `bg-surface`; (3) the balance card's inner stats box had a mismatched
  corner radius against the outer card — fixed the nesting math (outer
  `rounded-3xl`/32px minus an 8px margin = inner `rounded-lg`/24px, and
  added a `--radius-2xl` token that had been silently missing, which several
  other components were relying on) ; (4) the "This has already happened" /
  "Roll over unused amount" toggle switches had a thumb-position bug
  (`translate-x-5.5` overshooting the track by 2px, no matching left inset)
  — fixed in both `transaction-form.tsx` and `budget-form.tsx`.
- ~~**Per-account-type stock icons.**~~ Done (2026-09-15). New
  `ACCOUNT_TYPE_ICONS` (`lib/constants.ts`) maps each account type (Bank,
  Cash, Credit Card, Wallet, UPI, Savings, Investment, Other) to its own
  4-icon set; `IconColorPicker` gained an optional `icons` prop to restrict
  its grid to a subset instead of the full generic list, and `AccountForm`
  passes the current type's set, live-updating as the type dropdown changes.
  Verified in-browser: switching Bank → Credit card in the Add Account
  dialog swaps the icon grid from landmark/building/banknote/wallet to
  credit-card/wallet/receipt/tag. The Institution/Last 4 Digits/Notes fields
  from the earlier reference screenshot are still not built — remains
  unconfirmed as wanted, flagged for a follow-up conversation if desired.
- ~~**Transaction sheet UX (2026-09-13).**~~ Clicking a transaction now opens
  a read-only `TransactionDetails` view first (icon, amount, category/
  account, date, note) instead of jumping straight into the editable form —
  `transaction-sheet.tsx` tracks a `view`/`edit` mode, reset via React's
  "adjust state during render" pattern (not an effect, to satisfy the
  `set-state-in-effect` lint rule). The details view has **Delete** and
  **Edit transaction** side by side; Delete requires a second explicit
  confirm ("Delete" → "Yes, delete"/"Cancel") — transactions previously had
  no delete confirmation at all (other entities already used a native
  `confirm()`). Pressing Edit opens the form with **Save changes** /
  **Discard** (Discard returns to the details view without saving; no
  Delete button in the form anymore — that only lives on the details view
  now). Also removed the "This has already happened" completed/upcoming
  toggle from the form entirely per user request — manually-added
  transactions are now always `COMPLETED`; `UPCOMING` remains a valid
  status for whenever the recurring-transactions feature (below) starts
  generating them.
- ~~**Running balance per transaction.**~~ Done (2026-09-13): `getRunningBalances`
  in `src/lib/balances.ts` walks each account's COMPLETED transactions in
  chronological order and the `/transactions` list shows "Bal $X" per row.
- ~~**"Profile" instead of "Settings".**~~ Done (2026-09-13): route moved to
  `/profile` (`/profile/categories` for category management), nav label
  updated, editable display name + a 10-preset icon/color avatar picker
  (`src/lib/avatars.ts`) added, avatar shown in sidebar + mobile header.

## Remaining spec phases (not yet built)

- ~~**Goals.**~~ Done (2026-09-13). The `Goal` model already existed in
  Prisma, so no migration was needed. New `/goals` page
  (`GoalsView`/`GoalCard`/`GoalDetails`/`GoalForm`), added to the desktop
  sidebar and — following the same rollout as Recurring — reached on mobile
  via a Profile link rather than a 5th/6th bottom-nav icon (no room there).
  Create/edit (name, target amount, optional target date, optional linked
  account, icon/color); click-through details → edit / archive / delete
  mirrors the Accounts and Transactions pattern from earlier this session
  (read-only details first, Delete double-confirms). A goal has no currency
  of its own — it uses its linked account's currency, or the user's primary
  currency if unlinked. **Contribute-to-goal flow**: an "Add funds" dialog
  on the details view calls `contributeToGoalAction`, which bumps
  `currentAmount` and — only when a linked account is set — also creates a
  real `EXPENSE` transaction debiting that account (so the money leaving
  toward the goal actually shows up in that account's balance and ledger,
  not just as an abstract goal counter); reaching the target auto-flips
  status to `COMPLETED`. Deleting a goal that already has contributions
  archives it instead (same "don't orphan a Transaction.goalId" reasoning
  as Accounts' delete-vs-archive rule). Verified end-to-end via a scripted
  browser run: create → contribute → progress bar/percentage update and
  persist across a reload → edit → archive → shows under an "Archived"
  section.
- ~~**Recurring transactions & subscriptions.**~~ Done (2026-09-13). The
  `RecurringTransaction` model already existed in Prisma, so no migration
  was needed. Built: `src/lib/recurring-generator.ts`
  (`generateDueOccurrences`) walks each active rule's schedule
  (DAILY/WEEKLY/MONTHLY/YEARLY × interval) and materializes real
  `Transaction` rows up to a 30-day lookahead — due-today-or-earlier
  occurrences are created `COMPLETED`, future ones `UPCOMING` (capped at 60
  occurrences/rule/run as a safety guard against a stale `nextOccurrence`
  generating an unbounded batch). Called opportunistically from
  `getDashboardData` and `getRecurringTransactions` (no cron infra exists,
  so this is a lazy "runs on page load" approach — good enough at this
  scale, revisit if it ever needs to run without a page visit). New
  `/recurring` page (`RecurringView`/`RecurringForm`/`RecurringCard`) —
  create/edit/pause-resume/delete (delete pauses instead of hard-deleting
  if it already generated transactions, matching the archive-on-conflict
  pattern used elsewhere). Added to desktop sidebar nav; mobile reaches it
  via a new Profile → "Recurring & subscriptions" link and a "Manage" link
  on the dashboard's Upcoming card (bottom nav has no room for a 5th icon).
  Editing a rule's frequency/interval/start date does **not** recompute
  `nextOccurrence` — a known simplification; delete and recreate if the
  schedule itself needs to change.
- ~~**Live-verify recurring transactions.**~~ Done (2026-09-15) — and it's a
  good thing this was finally checked, because it surfaced a **real
  duplication bug**, not just a connectivity flake. `generateDueOccurrences`
  runs opportunistically from three independent data-fetch paths
  (`lib/data/dashboard.ts`, `lib/data/transactions.ts`,
  `lib/data/recurring.ts`) with no coordination between them — and Next.js's
  own `<Link>` prefetching alone is enough to fire two or three of those
  concurrently for a single normal page load (confirmed by scripting 3
  concurrent authenticated page loads against `/dashboard`, `/transactions`,
  `/recurring` at once). Each concurrent call read the same stale
  `nextOccurrence`, so all of them generated the identical batch of
  occurrences — a DAILY test rule produced 3x duplicate transactions per day
  instead of one. Fixed in `lib/recurring-generator.ts` with an optimistic
  compare-and-swap: the `nextOccurrence` advance is now a
  `recurringTransaction.updateMany({ where: { id, nextOccurrence: <the
  value just read> } })` inside the same DB transaction as the
  `transaction.createMany` — only the first concurrent caller to commit
  actually matches a row (Postgres serializes the competing `UPDATE`s), so
  every other concurrent caller sees `count === 0` and skips creating its
  now-stale batch instead of duplicating it. Re-verified with the same
  3-concurrent-page-load script after the fix: exactly 30 transactions for
  30 distinct dates, zero duplicates.
- ~~**Reports & analytics.**~~ Done (2026-09-13). New `/reports` page
  (`lib/data/reports.ts`), added to the sidebar + a Profile link on mobile
  (same rollout as Goals/Recurring). Preset date-range control (This month /
  Last month / Last 3 months / This year / All time / Custom, the last using
  the existing `DatePicker`) drives a summary row (income/expense/savings)
  and a **category breakdown** — ranked list with icon, amount, and percent
  bar, toggled between Expenses/Income via `SegmentedControl`. **Month-over-
  month comparison** and **savings-over-time** are one combined chart
  (`MonthlyTrendChart`, income/expense bars + a savings line, recharts
  `ComposedChart`) — deliberately on a fixed trailing-6-month window
  independent of the date-range control, since mixing a custom day range
  with "month-over-month" buckets doesn't make sense. **Account analysis**
  lists each account's income/expense within the selected range next to its
  current balance. Same scoping limitation as the dashboard's existing
  aggregates (and the still-open "Multi-currency conversion" item below):
  breakdowns and the monthly chart only include transactions in the user's
  *primary* currency — no cross-currency conversion yet. Verified end-to-end
  against a seeded account with categorized income/expense transactions:
  summary totals, category rows, tab switching, preset switching (including
  the empty state for a period with no activity), and the custom-range
  controls all rendered correctly with zero console errors.
- ~~**Import / export.**~~ Done (2026-09-13). New `/import-export` page,
  reachable only via a Profile link (no sidebar slot — this is an occasional
  maintenance action, not a daily destination like Goals/Reports).
  **Export**: `GET /api/export/transactions` streams every transaction as a
  CSV (`Date, Type, Account, TransferToAccount, Category, Title, Note,
  Amount, TransferToAmount, Currency, Status`) via a plain `<a download>` —
  a route handler rather than a server action, since a server action can't
  hand back a file download. **Import**: upload a CSV in the same column
  format; `lib/import-transactions.ts` parses it (hand-rolled RFC4180-ish
  parser in `lib/csv.ts` — quoting/escaping only, not worth a dependency),
  resolves Account/Category by name (case-insensitive, must already exist —
  deliberately doesn't auto-create an account, since guessing its currency
  would be risky), and validates each row (parseable date, valid
  EXPENSE/INCOME/TRANSFER type, amount, and — a currency-mismatch check
  worth calling out — the CSV's Currency column must match the resolved
  account's actual currency, or the row errors out rather than silently
  misinterpreting the amount). **Duplicate detection**: same account + same
  calendar day + same amount + same title (case-insensitive) as an existing
  transaction is flagged as a likely duplicate and excluded by default (an
  "import possible duplicates too" checkbox overrides this per-import, not
  per-row). The preview step shows ready/duplicate/error counts and a
  per-row reason before anything is written — nothing is inserted until the
  user reviews and clicks Import. Verified end-to-end with a 3-row CSV (one
  exact duplicate of a seeded transaction, one new valid row, one row citing
  an unknown account): preview correctly showed "1 ready / 1 possible
  duplicate / 1 error" with the right per-row messages, and committing
  imported only the 1 valid row — the duplicate wasn't re-added and the
  error row wasn't inserted. Zero console errors.
- ~~**Backup / restore.**~~ Done (2026-09-15). New `lib/backup.ts`:
  `exportUserBackup` (a versioned JSON export of every account, category,
  tag, transaction, budget, goal, and recurring rule — deliberately
  excludes the `User` row itself, so it's a data backup, not an account
  transplant; restoring never touches login credentials or account-level
  settings) and `restoreUserBackup` (wipes the user's entire dataset and
  replaces it, remapping every id through old-id → new-id tables built up
  front so the whole thing runs as `createMany` batches inside one
  transaction rather than row-by-row). `GET /api/export/backup` streams the
  download (a route handler, same reasoning as the existing transaction
  export — a server action can't hand back a file); new `BackupCard` on
  `/import-export` (download button + upload-and-restore, gated behind a
  `ConfirmDialog` since restoring is destructive and irreversible).
  `validateBackup` does a narrow structural/version check before any delete
  runs, to catch a wrong/corrupted file early. Verified end-to-end in a
  live browser session: downloaded backup has the expected shape
  (version/accounts/categories/transactions/budgets/goals/recurring, all
  populated) for a seeded multi-account, multi-currency user.
- ~~**Notifications.**~~ Done (2026-09-15). In-app only — no email/push/SMS
  infra, so `lib/data/notifications.ts#getNotifications` just does a live
  read of data that already exists (upcoming bills within 7 days, budgets
  80%+ spent, goals 90%+ funded) and recomputes it on every load rather than
  storing rows. New `User.notifyBills`/`notifyBudgets`/`notifyGoals`
  columns (migration `add_user_notification_prefs`, default `true`) gate
  each category independently; a new `NotificationPrefs` card on `/profile`
  exposes the three toggles via `updateNotificationPrefsAction`. New
  `NotificationBell` (bell icon + unread dot + popover list, reused in both
  the desktop `Sidebar` and mobile `MobileHeader`) reads the same
  `AppNotification[]` computed once in `AppShell` and passed down. Verified
  live against a seeded user with all three conditions triggered
  simultaneously (a 96%-used budget, a 95%-funded goal, a bill due in 3
  days) — bell showed all three with correct copy and working links;
  toggling a pref off in Profile and reloading removed that category from
  the bell.
- ~~**Settings depth.**~~ Done. Notification prefs done 2026-09-15 (see
  Notifications above); password change and currency change were already
  done (see "Requested next" sections). About/privacy was also already
  done, just never crossed off here: `AboutSection` (`/profile`) has the
  app description, a developer note, and a `Version` row reading live from
  `package.json` via `APP_VERSION`; `ProfileLegalLinks` links Terms,
  Acceptable Use, Privacy Policy, and Contact us.
- **Multi-currency conversion — dashboard done, Reports on hold.**
  `getDashboardData` (`lib/data/dashboard.ts`) now converts every
  other-currency account into the user's primary currency via
  `getExchangeRate` (the same Frankfurter-backed lookup the transfer form
  already uses) and shows the result as a "net worth (converted)" line
  under Total Balance on `BalanceCard` — null (silently falls back to just
  the primary-currency total) rather than a guessed number if any rate
  can't be fetched. Verified live: a user with an INR primary account plus
  a USD account showed both the per-currency "Other balances" row and a
  correctly-converted net worth figure. Reports/category-breakdown still
  only aggregate primary-currency transactions — no cross-currency
  conversion there yet. **Explicitly put on hold (2026-09-15)** — not
  declined, just not being picked up this round.
- ~~**Accessibility pass — icon-only buttons, unlabeled toggles, dialog
  wiring, skip link.**~~ Done (2026-09-15, v3.3.0), on top of the earlier
  heading-order/progress-bar-label/contrast fixes below. Targeted audit, not
  a full rewrite: (1) 3 icon-only buttons were missing `aria-label` —
  `Sheet`'s close button (shared by nearly every dialog in the app),
  `CategoriesView`'s per-row options button, `BudgetCard`'s options button;
  (2) the shared `Sheet` wasn't setting `aria-describedby={undefined}` when
  it renders without a `Dialog.Description` (no-description or `hideHeader`
  case) — the same Radix gotcha already handled correctly elsewhere
  (`ProfileForm`, `ChangePasswordDialog`) — fixed conditionally, since
  `Sheet` *does* sometimes render a real description and that case must
  keep Radix's automatic linkage intact; (3) 6 toggle switches
  (`role="switch"` buttons built from a bare icon-less `<span>` thumb) had
  no accessible name at all — the Emergency Fund/"daily expenses" toggles in
  `AccountForm`, "Roll over unused amount" in `BudgetForm`, "Has an end
  date"/"This is a subscription" in `RecurringForm`, and the shared
  `Toggle` in `NotificationPrefs` (used 3×) — all given an explicit
  `aria-label` matching their adjacent visible text; (4) new "Skip to main
  content" link in `AppShell`, visually hidden until focused (`sr-only
  focus:not-sr-only`), landing on a new `id="main-content"` on `<main>` —
  there was none before. Audited and confirmed clean: `alt` text (only one
  `<img>` exists app-wide, already deliberately `alt=""` for a decorative
  user photo), every link/button beyond the above already had an accessible
  name, global `:focus-visible` styling already existed. Still open: a
  dedicated screen-reader pass (this was a targeted sweep, not a full
  NVDA/VoiceOver walkthrough).
- ~~**Performance — duplicate query dedup.**~~ Done (2026-09-15, v3.3.0), on
  top of the running-balance rewrite below. `getBudgets`
  (`lib/data/budgets.ts`) was being queried twice on the same request on
  both `/dashboard` and `/budgets` — once by the page itself, once by
  `getNotifications` (reads budgets for the "budget alert" category) inside
  `AppShell` — both uncached. Wrapped `getBudgets` in React's `cache()`,
  same de-dupe pattern `getCurrentUser`/`getAccounts`/`getCategories`
  already use. **Judged not worth building this round**: true virtualization
  of the `/transactions` list. Seriously considered, since it's explicitly
  named below, but that list has a real history of scroll bugs (the
  v2.2.0/v2.3.0 nested-scroll and touch-scroll fixes) and already has a
  working, much lower-risk mitigation — server-paginated "Load more" at 40
  rows/page, never rendering the full history at once. At this app's
  realistic single-user transaction volume, windowing the DOM buys little
  and risks reopening exactly the bugs already fixed twice. Revisit only if
  a real account's transaction count grows into the many-thousands and
  "Load more" itself becomes the bottleneck. Pagination size itself (40/page)
  was reviewed and left as-is — already reasonable.
- ~~**Final visual QA**~~ — a pixel-level pass across every screen/state.
  Done (2026-09-15, v3.3.0) via a scripted headless-browser sweep of every
  page (desktop + ~400px mobile width), plus targeted verification of this
  round's three new pieces (Clear all data dialog, the last-backup line's
  before/after states, and the verified badge correctly *not* appearing for
  a normal test account).

## Known non-issues (leave as-is)

- Expense amounts render in neutral text (not red) by design — only income
  gets a distinct green, expense relies on the "-" sign + icon + context.
  Revisit only if the visual redesign above changes this intentionally.
