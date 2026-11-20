-- A loan can have no repay-by date.
ALTER TABLE "Loan" ALTER COLUMN "dueDate" DROP NOT NULL;
