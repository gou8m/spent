# Spent

A calm, premium personal finance and expense tracker — accounts, transactions,
categories, and budgets with a real backend, correct money math, and a
responsive design system built from scratch for light and dark mode.

## Stack

- **Next.js 16** (App Router) + **TypeScript**, Tailwind v4 for the design system
- **Prisma** + **SQLite** for data, with a schema written to move to Postgres later
- **NextAuth (Auth.js) v5** — credentials auth, bcrypt-hashed passwords, JWT sessions, middleware-protected routes
- **Zod** validation on every server action, **React Hook Form** on the client
- **Recharts** for the cash-flow chart, **Radix UI** primitives for accessible dialogs/selects/popovers, **Zustand** for the small bit of cross-component UI state (the add-transaction sheet)
- Money is stored as integer minor units (cents) everywhere — never floats

## Getting started

```bash
npm install
cp .env.example .env   # fill in a real AUTH_SECRET
npx prisma db push     # creates prisma/dev.db
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, and
you're in — a starter "Cash" account and a set of default categories are
seeded automatically.

## What's here

- Dashboard: balance, income/expense/savings, 30-day cash-flow trend, budget
  overview, recent + upcoming transactions
- Transactions: add/edit (expense, income, transfer), filterable/searchable
  list grouped by date
- Accounts, Categories, Budgets: full CRUD; deleting something still
  referenced by other data archives it instead of destroying history
- Light/dark theme, fully responsive from 320px phones to ultrawide desktops

## Not yet built

Goals, recurring transactions/subscriptions, deeper reports & analytics,
CSV import/export, backup/restore, notifications, and a fuller settings area
are designed into the data model but not yet built out.
