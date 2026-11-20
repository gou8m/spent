# Standalone loans — plan of action

Status: built in 3.19.0 (both phases). Written 2026-11-20.

## The need

"I took ₹50,000 from someone long ago. Interest counts. I don't know if it was cash or another form, so I don't want it in my transactions."

So: add a loan that lives only in Loans (under Accounts). It must not create a transaction and must not change any account balance, but interest and repayments must still work.

## Good news: the data model already allows it

A `Loan` today normally points to the transaction that moved the money. A loan carried over from an older one ("rolled over") has no transaction, and instead stores its own `principal`, `title`, `currency` and `startDate`. A standalone loan is the same shape. No new table.

`loanBasics()` already reads principal and start date from either source, and the interest maths in `loan-math.ts` is already driven by those two numbers. So "interest counts from a start date long ago" works as is.

## What changes

**Phase 1 (about 2 days, no migration)**
- "Add an existing loan" sheet, opened from Loans (a button in the header and a dashed card at the bottom of the list).
- Fields: I owe / They owe me, who, amount, taken on (any past date), interest on or off with rate per month or year, repay by.
- Live preview in the sheet: "By today: ₹22,175 interest, ₹72,175 in all, about ₹16 more each day."
- A short line that says it clearly: no transaction is created, no balance changes.
- A small "Outside Spent" tag on these loans in lists and details.
- New server action `createStandaloneLoanAction`: validates, scopes by user, stores the loan with `transactionId = null` and a flag (see below), refuses amounts over the 32-bit limit.
- Repaying uses the existing flow: a payment from one of your accounts is a normal transaction that points at the loan.

**Phase 2 (about 2 days, one additive migration)**
- Payments made outside Spent (cash, someone else paid) need a payment row with no transaction. Today `LoanPayment.transactionId` is required. Make it optional, and add `paidOn` and `note` to `LoanPayment`.
- "Record a payment" sheet offers two ways: from one of my accounts (adds a transaction), or outside Spent (no transaction, no balance change). Both split interest first, then principal, as today.

**Small schema flag (Phase 1)**
- `Loan.standalone Boolean @default(false)`. A rolled-over loan also has no transaction, so this tells the two apart for labels and for edit and delete rules (a standalone loan can be edited and deleted; a rolled-over one cannot).

## Where it shows

| Place | Behaviour |
|---|---|
| Loans page | Counts in "You owe" or "You are owed", tagged Outside Spent |
| Accounts net worth and the Loans card | Counts as a liability or an asset, exactly like other loans |
| Transactions, reports, budgets, calendar spending | Never appears (no transaction exists) |
| Calendar | Due date shows as a loan due, like other loans |
| People chat | A loan card at its start date: "Existing loan, ₹50,000". No bubble from a transaction |
| Reminders and bell | Same due-date reminders as other loans |
| Backup and restore | Included (the loan row carries its own principal, title, date) |

## Edge cases to handle

- Editing the start date or amount after payments exist: recompute interest, keep payments.
- Deleting a standalone loan that has payments: confirm, remove its payments too, never touch transactions.
- A payment from an account later deleted: the loan goes back up, same as today.
- Currency: the loan keeps its own currency; totals follow the existing "main currency only" rule with a note for others.
- Very old start dates: cap at 50 years, warn on a date in the future.
- Interest-free loans and zero rate: the preview says "No interest".

## Tests

- Loan maths for a standalone loan: interest from a past start date, leap years, interest-first payments, partial payments, waive and settle.
- Server action: another user's data cannot be touched, bad amounts and dates rejected, no transaction row is created, no account balance changes (balance before equals balance after).
- Phase 2: a payment without a transaction leaves balances alone and still reduces what is owed.

## Mock screens

In `mockups/standalone-loan/`: Loans list with the new entry, the Add sheet with live interest preview, Loan details with history, and Record a payment with the two ways.

## Questions

1. Should an outside payment ask for a date and note, or just amount and date? (Plan: amount, date, optional note.)
2. Should standalone loans appear in the People chat at all? (Plan: yes, as one "Existing loan" card.)
3. Cap on how far back a start date can go? (Plan: 50 years.)
