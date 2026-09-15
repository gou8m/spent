-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyBills" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyBudgets" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyGoals" BOOLEAN NOT NULL DEFAULT true;
