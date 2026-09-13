-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "cashDenominations" JSONB;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "denominations" JSONB;
