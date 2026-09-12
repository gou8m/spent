# Spent — Roadmap

Status snapshot as of v1.0.0. "Deep core" (auth, design system, responsive
shell, dashboard, transactions, accounts, categories, budgets) is built and
browser-tested. Everything below is scoped but not yet built.

## Requested next (from user feedback, 2026-09-12)

- **Visual redesign — new aesthetic direction.** Current UI/UX structure is
  good but the visual style and typography need to change to something more
  distinctive/"aesthetic" — user referenced a "District app" look as a
  reference point. Needs a follow-up conversation to pin down the actual
  reference (screenshots or a link) before redesigning tokens — don't guess
  at "District app" specifics from memory.
- **New font pairing.** Replace Plus Jakarta Sans / Geist Mono with something
  more distinctive once the visual direction above is settled.
- **Running balance per transaction.** Each row in the transaction list
  should show the account's balance *as of* that transaction (like a bank
  statement's running-balance column), not just the transaction amount.
  Needs a per-account running-balance computation over the sorted
  transaction list (chronological order matters — likely computed
  server-side alongside `getTransactions`).
- **"Profile" instead of "Settings".** Rename the settings nav entry/page to
  "Profile". Add an editable display name and a picker for a small set of
  stock/preset profile photos (not arbitrary image upload) — avatar shows in
  the sidebar/mobile header.

## Remaining spec phases (not yet built)

- **Goals** — Goal model already exists in Prisma; needs UI (create/edit,
  progress, contribute-to-goal flow, optional linked account).
- **Recurring transactions & subscriptions** — recurrence rules (rent,
  salary, EMI), a generator that materializes upcoming transactions from
  them, a dedicated upcoming/subscriptions view.
- **Reports & analytics** — category breakdown chart, month-over-month
  comparison, account analysis, savings-over-time, custom date-range picker.
- **Import / export** — CSV export, CSV import with validation + duplicate
  detection.
- **Backup / restore** — JSON export/import of a user's full dataset (local
  SQLite, so this is the practical equivalent of "sync" for now).
- **Notifications** — in-app reminders for upcoming bills, budget
  thresholds, goal milestones (no email/push infra exists yet).
- **Settings depth** — password change, notification prefs, currency change
  with recalculation, about/privacy (beyond the Profile rework above).
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
