-- Month-end and last-working-day rules, amounts that change each time, and a repeating bonus for recurring items.
ALTER TABLE "RecurringTransaction" ADD COLUMN "dayRule" TEXT NOT NULL DEFAULT 'DAY';
ALTER TABLE "RecurringTransaction" ADD COLUMN "amountVaries" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RecurringTransaction" ADD COLUMN "bonusAmount" INTEGER;
ALTER TABLE "RecurringTransaction" ADD COLUMN "bonusEveryMonths" INTEGER;
