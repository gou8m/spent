# Spent — Roadmap

Status snapshot as of v1.0.0. "Deep core" (auth, design system, responsive
shell, dashboard, transactions, accounts, categories, budgets) is built and
browser-tested. Everything below is scoped but not yet built.

## Requested next (from user feedback, 2026-09-13, v2.8.0 round)

- ~~**Denomination input redesigned as a scroll-and-save picker.**~~ Done —
  replaced the v2.7.0 static grid (every denomination shown with its own
  number box, all submitted together) per explicit design feedback, after
  confirming the interaction with the user before rebuilding (two open
  questions: does each denomination's Save persist immediately or just
  join a local list saved with the rest of the form? does this apply to
  both the account form and the transaction form, or just one? — answered
  "local list" and "both," respectively). `DenominationInput`'s public
  interface (`currency`/`value`/`onChange`) is unchanged, so this was a
  drop-in swap with no changes needed in `AccountForm`/`TransactionForm`.
  New interaction: a horizontally scrollable strip of chips, one per
  denomination (largest first) — each shows the value, a "×", a count
  field, and its own Save button. Typing a count doesn't touch the
  component's `value` (and so doesn't affect the account/transaction form's
  own submit) until that specific denomination's Save is tapped; saved
  entries appear in a running "Denominations available" list below (with a
  remove button per entry), which is what actually gets submitted when the
  enclosing form's own Save/Add button is pressed. Verified end-to-end:
  saving one denomination while a second is only half-typed correctly
  excludes the untyped one from the summary until it's explicitly saved;
  removing a saved entry works; the final persisted breakdown matches
  exactly what was saved (not what was ever typed); confirmed working in
  both the account form and the transaction form, zero console errors.

## Requested next (from user feedback, 2026-09-13, v2.7.0 round)

- ~~**Cash denomination breakdown.**~~ Done — the last item from the
  "cash accounts — denomination breakdown" backlog entry (previously
  deferred, see "Known non-issues" era note below). New `Account.cashDenominations`
  and `Transaction.denominations` (both `Json?`, count per note/coin value,
  e.g. `{"500": 2, "100": 5}`) — migration `add_cash_denominations`.
  `lib/denominations.ts` has real note/coin values for all 15 currencies in
  `CURRENCIES`, largest-first. New shared `DenominationInput` (a grid of
  count fields for the account's currency) wired into: **`AccountForm`**
  (CASH accounts only — sets the account's current holdings breakdown,
  shown read-only on `AccountDetails`), and **`TransactionForm`** (EXPENSE
  or INCOME against a CASH account only — optional breakdown of what was
  given/received for that transaction; the Zod schema rejects a breakdown
  that doesn't sum to the transaction amount). Saving a transaction with a
  breakdown adjusts the account's tracked holdings accordingly (subtract
  for EXPENSE, add for INCOME); editing or deleting the transaction
  correctly reverses the *original* effect first. Deliberately **not**
  clamped at zero — a subtract-then-add has to be a perfect inverse for
  edit/delete reversal to stay correct, and clamping breaks that (verified
  by hitting exactly this bug live: clamping silently created a phantom
  denomination entry on delete that was never actually part of the
  account's holdings). A negative count is now shown as-is with an
  inline warning, rather than hidden — it means the transaction recorded
  spending more of a note than the account had on file, which is
  information worth surfacing, not masking. Verified end-to-end with a
  live browser run covering the full lifecycle: seed a breakdown → confirm
  it shows on `AccountDetails` and pre-fills in `AccountForm` → record an
  expense with its own breakdown → confirm the account's holdings updated
  correctly (including a deliberately-underfunded denomination going
  negative with the warning shown) → delete that transaction → confirm the
  account's breakdown is restored to *exactly* its original state.

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
- **Verified-mobile-number badge — planned, not built.** Per request,
  documenting the plan here rather than writing unwired code: since
  `User.phone` was removed entirely earlier this session (see "Removed the
  phone number field" above), there's currently no phone field for a
  verification badge to attach to. When phone comes back, this would need:
  (1) `User.phone` + `User.phoneVerified: DateTime?` columns, (2) an OTP
  send/verify flow (needs an SMS provider — Twilio and MSG91 are the usual
  choices for an India-based app; this is a real per-message cost, unlike
  email), (3) a small checkmark badge next to the phone number once
  verified, matching the pattern email verification already uses. Held off
  writing the actual component/schema/action code until the phone field
  itself is reintroduced and the SMS provider is chosen — inert scaffolding
  for a field that doesn't exist yet would just be dead code to maintain.

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
- ~~**Cash accounts — denomination breakdown.**~~ Done — see the "v2.7.0
  round" entry near the top of this file for the full writeup. Landed on
  "a breakdown entry field per denomination," the first option this note
  had flagged as needing a follow-up conversation.
- **Per-account-type stock icons.** Replace/extend the account icon picker so
  each account type (Checking, Savings, Credit Card, Cash, etc.) gets its
  own distinct stock icon set, rather than one shared generic icon list —
  similar in spirit to the preset avatar picker (`src/lib/avatars.ts`).
  User shared a reference screenshot of an "Add Account" form (also shows
  Institution, Last 4 Digits, and Notes fields not currently in
  `account-form.tsx` — flagged for reference, not yet confirmed as wanted).
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
- **Live-verify recurring transactions.** Typecheck/lint clean but not yet
  confirmed end-to-end in the browser — Supabase's pooler
  (`aws-0-ap-northeast-2`) was intermittently unreachable during this
  session (`Can't reach database server`, P1001) independent of any app
  code (the earlier connection-pool bug was already fixed); one page load
  did succeed but took ~25s. Worth checking the Supabase project's health/
  region/tier if this keeps happening — it's now visibly affecting normal
  usage, not just heavy test traffic.
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
- **Backup / restore** — JSON export/import of a user's full dataset (local
  SQLite, so this is the practical equivalent of "sync" for now).
- **Notifications** — in-app reminders for upcoming bills, budget
  thresholds, goal milestones (no email/push infra exists yet).
- **Settings depth** — notification prefs, about/privacy (beyond the Profile
  rework above; password change and currency change are already done — see
  "Requested next" sections).
- **Multi-currency conversion** — each account/transaction already keeps its
  own currency correctly (no incorrect math), but there's no exchange-rate
  conversion for a unified net-worth view across currencies yet.
- **Accessibility audit** — built accessibly throughout (focus states,
  semantic roles, contrast-aware tokens) but not yet given a dedicated
  keyboard/screen-reader pass.
- **Performance pass** — virtualize long transaction lists, tune pagination,
  add query caching where it matters. Fine at demo scale, untested at
  thousands of rows.
- **Final visual QA** — a pixel-level pass across every screen/state.

## Known non-issues (leave as-is)

- Expense amounts render in neutral text (not red) by design — only income
  gets a distinct green, expense relies on the "-" sign + icon + context.
  Revisit only if the visual redesign above changes this intentionally.
