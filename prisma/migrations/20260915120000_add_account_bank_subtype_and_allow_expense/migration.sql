-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "bankSubtype" TEXT,
ADD COLUMN     "allowExpense" BOOLEAN NOT NULL DEFAULT true;
