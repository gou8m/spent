# Contributing to Spent.

Thanks for taking an interest. Bug reports, ideas and pull requests are all welcome.

## Reporting a bug or suggesting a feature

Open an [issue](https://github.com/gou8m/spent/issues/new/choose) and pick the matching template. For a bug, the most useful things are the steps to reproduce, what you expected, what happened, and the device and browser. Screenshots help. Please do not post real account data.

Security problems go through [SECURITY.md](SECURITY.md), not a public issue.

## Running it locally

See [Getting started](README.md#getting-started). You need Node.js 20+ and a PostgreSQL database.

## Before you open a pull request

1. Branch from `main` (`git checkout -b fix/short-description`).
2. Keep the change focused: one fix or feature per pull request.
3. Run the checks, all of which must pass:
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build
   ```
4. Follow the conventions already in the code:
   - Money is always an **integer in minor units** (cents, paise), never a float. Use the helpers in `src/lib/money.ts`.
   - Every server action validates its input with **Zod** and checks that the record belongs to the signed-in user.
   - UI uses the design tokens in `src/app/globals.css` (no hard-coded colours) and works in light and dark mode and from 320 px wide up.
   - Do not add a dependency for something small; mention it in the pull request if you must.
5. Describe what changed and why, and add screenshots for anything visual.

## Commit messages

Short and in the present tense, for example `Budgets: restore archived budgets`.
