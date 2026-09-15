-- AlterTable
ALTER TABLE "User" ADD COLUMN     "readNotificationIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
