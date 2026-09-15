-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastBackupAt" TIMESTAMP(3),
ADD COLUMN     "lastBackupFilename" TEXT;
