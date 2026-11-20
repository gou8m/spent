# Shared expenses ("Splitwise type") — plan of action

Status: plan only, nothing built. Written 2026-11-20.

## 1. What we are building

Split a bill with friends, track who owes whom, settle up. Groups (trip, flat, office lunch) and one-to-one friends.

Spent already has the hard parts of the neighbourhood: People chats, loans with interest, the add sheet with smart prompts, share links, email, rate limiting. Shared expenses plug into those.

## 2. The one decision that shapes everything: own share vs cash out

You pay ₹3,000 for dinner for four. Two true facts:

- Your account goes down by ₹3,000 (cash out).
- Your spending is ₹750 (your share). The other ₹2,250 is money others owe you, not an expense.

Options:

| Option | Idea | Risk |
|---|---|---|
| A. `spendAmount` on Transaction | Keep one transaction (full cash out). Add a nullable `spendAmount` = your share. Reports, budgets, calendar and category totals use `spendAmount ?? amount` for expenses. Balances use `amount`. | Touches every spending aggregate (about 8 queries). Needs tests per query. |
| B. Two entries | Expense ₹750 plus a "paid for others" entry of ₹2,250 outside spending. | Needs a new transaction kind; every switch on `type` must learn it. |
| C. Reuse Loans | Each friend becomes a ₹750 loan. | Pollutes Loans and People (interest, due dates). Wrong tool. |

**Recommendation: A.** Smallest data change, one visible row per real payment, and balances stay correct. We write the aggregate changes first, behind tests, before any UI.

## 3. Who is in a group

- **Phase 1: names only ("ghost" members).** You track what everyone owes. Works with no one else installing anything.
- **Phase 2: real users.** Invite by link, WhatsApp, email or phone (we now collect phone). Members see the same group live. Each person's own copy of an expense is a private personal transaction.

## 4. Data model (additive migrations only)

- `Group` — owner, name, currency (one per group in v1), icon, archivedAt.
- `GroupMember` — group, optional `userId`, display name, optional email or phone, invite token and status (INVITED, ACTIVE, LEFT).
- `GroupExpense` — group, title, date, total (minor units), split type, category, note, createdBy, deletedAt (soft delete).
- `GroupExpensePayer` — expense, member, paid amount (supports several payers).
- `GroupExpenseSplit` — expense, member, owed amount, plus the raw input (percent or shares).
- `GroupSettlement` — group, from member, to member, amount, date, note.
- `GroupActivity` — who did what, for the feed and audit.
- `Transaction.spendAmount` — see section 2. Optional link from a personal transaction to its group expense.

Balances are computed, never stored: paid minus owed, plus settlements. "Simplify debts" uses a greedy minimum cash-flow pass.

Money rules: integers only. Remainder paise from uneven splits go to members by a fixed rule (largest remainder, ties to the payer, then member order), so every split adds up exactly. Property tests prove it.

## 5. Screens and flows (mobile first, same visual language)

1. **Transactions tab gets a third tab:** Timeline, People, Groups.
2. **Groups list:** each group with your net (you are owed / you owe) and member avatars.
3. **Group page:** balance hero (two equal pills, as elsewhere), a feed of expense cards ("Dinner. You paid ₹2,400. You lent ₹1,800."), Balances tab with simplified debts and a Settle button, Members.
4. **Add expense (inside a group):** amount, title, paid by (you by default), split chips: Equally, Exact, Percent, Shares. Live preview: "Each owes ₹600." Smart rounding note when it does not divide evenly.
5. **From the normal add sheet:** a **Split** chip beside Note, Repeat, Loan. Smart prompt after saving a Dining or Travel expense over a threshold: "Split this with friends?"
6. **Settle up:** records a payment between two members. Optionally creates your own personal transaction. In India, a UPI payment link (`upi://pay`) makes settling one tap (phase 3).
7. **People chats** show a "Shared" line for a friend you split with, kept apart from loans so the loans-only balance rule stays true.
8. **Invites:** share link and WhatsApp (the share buttons already exist), expiring tokens.

## 6. Phases

**Phase 0, design (2 to 3 days).** Lock option A. Five mock screens for the group page and add-expense flow. Test plan. Privacy review.

**Phase 1, ghost-member groups (about 2 weeks).**
- Models and migrations, split engine (equal, exact, percent, shares) with property tests, debt simplification with tests.
- `spendAmount` through every spending aggregate, with a test per query.
- Groups tab, group page, add expense, settle up, Split chip, smart prompts.
- Backup and restore, statement export, changelog, App guide, privacy policy text.

**Phase 2, real members (about 2 weeks).**
- Invites and membership, access checks on every read (member of the group, like `userId` scoping today), roles (owner can remove, anyone can add, creator or owner can edit).
- Notifications and email: "Ravi added Dinner", gentle settle reminders, weekly summary.
- Activity feed, edit conflict handling (last write wins plus an activity line), leave group.

**Phase 3, polish.**
- UPI settle links and WhatsApp reminders, receipt photos, recurring shared expenses (a flat's rent split), multi-currency groups, itemised bills, group PDF statement.

## 7. Security and privacy

- Every query joins through membership. No query by group id alone.
- Invite tokens are random, single purpose, expire, and are rate limited.
- Names, emails and phones of people who never signed up are personal data: collect only what is needed, show them only inside the group, delete on request, and say so in the privacy policy before launch.
- Soft delete keeps history honest; hard delete only when the owner closes a group with no activity.
- Server-side validation on every split (sums match, members belong to the group, amounts within the 32-bit limit).

## 8. What we reuse

People chat styling and bubbles, add-sheet parts (PromptCard, ChoiceCard, Reveal), amount input with commas, `withinRateLimit`, email and share links, GradientTile avatars, SlidingTabs, backup and restore.

## 9. Main risks

| Risk | Answer |
|---|---|
| Double counting in budgets and reports | Option A plus a test for each aggregate before UI work |
| Rounding drift | One split engine, property tests (sum always equals total) |
| Privacy of non-users | Minimal data, in-group only, deletion path, policy update |
| Scope creep | Phase 1 ships alone and is useful without invites |
| Edit conflicts between members | Phase 2 only; last write wins plus an activity line |

## 10. Questions to settle before Phase 0

1. Must members install Spent, or are names-only groups enough for the first release?
2. One currency per group at first, or multi-currency from day one?
3. Is a UPI settle link in scope for the first release?
4. Should shared balances ever count in the People "owed" total, or stay a separate line? (Recommended: separate.)
5. Free for everyone, or part of a future paid tier?
