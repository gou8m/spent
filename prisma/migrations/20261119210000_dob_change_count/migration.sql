-- How many times the birthday was changed after first being set (one change is allowed).
ALTER TABLE "User" ADD COLUMN "dobChangeCount" INTEGER NOT NULL DEFAULT 0;
