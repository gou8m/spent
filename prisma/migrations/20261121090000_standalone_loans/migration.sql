-- Loans added by hand (outside Spent) and loan payments that have no transaction.
ALTER TABLE "Loan" ADD COLUMN "standalone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LoanPayment" ALTER COLUMN "transactionId" DROP NOT NULL;
ALTER TABLE "LoanPayment" ADD COLUMN "paidOn" TIMESTAMP(3);
ALTER TABLE "LoanPayment" ADD COLUMN "note" TEXT;
