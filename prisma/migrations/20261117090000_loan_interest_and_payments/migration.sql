-- Loans: interest, closing out what is left, carried-over loans, and repayments that can span several loans.
-- Purely additive (plus relaxing Loan.transactionId to nullable); nothing is dropped.

ALTER TABLE "Loan" ALTER COLUMN "transactionId" DROP NOT NULL;

ALTER TABLE "Loan"
  ADD COLUMN "interestRate" DOUBLE PRECISION,
  ADD COLUMN "interestPeriod" TEXT,
  ADD COLUMN "interestStoppedAt" TIMESTAMP(3),
  ADD COLUMN "closedKind" TEXT,
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "closedAmount" INTEGER,
  ADD COLUMN "principal" INTEGER,
  ADD COLUMN "title" TEXT,
  ADD COLUMN "currency" TEXT,
  ADD COLUMN "startDate" TIMESTAMP(3),
  ADD COLUMN "rolledFromLoanId" TEXT;

CREATE TABLE "LoanPayment" (
  "id" TEXT NOT NULL,
  "loanId" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  CONSTRAINT "LoanPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LoanPayment_loanId_transactionId_key" ON "LoanPayment"("loanId", "transactionId");
CREATE INDEX "LoanPayment_transactionId_idx" ON "LoanPayment"("transactionId");
CREATE INDEX "Loan_rolledFromLoanId_idx" ON "Loan"("rolledFromLoanId");

ALTER TABLE "Loan" ADD CONSTRAINT "Loan_rolledFromLoanId_fkey" FOREIGN KEY ("rolledFromLoanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing single-loan repayments become one payment row each.
INSERT INTO "LoanPayment" ("id", "loanId", "transactionId", "amount")
SELECT 'lp_' || t."id", t."repaysLoanId", t."id", t."amount"
FROM "Transaction" t
WHERE t."repaysLoanId" IS NOT NULL;
