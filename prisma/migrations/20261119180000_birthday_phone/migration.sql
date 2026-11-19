-- Date of birth (18+ check and birthday wish), optional phone, and the year of the last birthday email.
ALTER TABLE "User" ADD COLUMN "dateOfBirth" DATE;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "lastBirthdayWishYear" INTEGER;
