-- Shared expenses: groups, members, expenses, shares and settle-ups. Additive only.
ALTER TABLE "Transaction" ADD COLUMN "extraOut" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "SplitGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SplitGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SplitMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isYou" BOOLEAN NOT NULL DEFAULT false,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SplitMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SplitExpense" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total" INTEGER NOT NULL,
    "splitType" TEXT NOT NULL,
    "paidById" TEXT NOT NULL,
    "note" TEXT,
    "transactionId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SplitExpense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SplitShare" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "owed" INTEGER NOT NULL,
    "input" DOUBLE PRECISION,
    CONSTRAINT "SplitShare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SplitSettlement" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SplitSettlement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SplitGroup_userId_idx" ON "SplitGroup"("userId");
CREATE INDEX "SplitMember_groupId_idx" ON "SplitMember"("groupId");
CREATE UNIQUE INDEX "SplitExpense_transactionId_key" ON "SplitExpense"("transactionId");
CREATE INDEX "SplitExpense_groupId_date_idx" ON "SplitExpense"("groupId", "date");
CREATE UNIQUE INDEX "SplitShare_expenseId_memberId_key" ON "SplitShare"("expenseId", "memberId");
CREATE INDEX "SplitSettlement_groupId_idx" ON "SplitSettlement"("groupId");

ALTER TABLE "SplitGroup" ADD CONSTRAINT "SplitGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitMember" ADD CONSTRAINT "SplitMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitExpense" ADD CONSTRAINT "SplitExpense_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitExpense" ADD CONSTRAINT "SplitExpense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "SplitMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SplitExpense" ADD CONSTRAINT "SplitExpense_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SplitShare" ADD CONSTRAINT "SplitShare_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "SplitExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitShare" ADD CONSTRAINT "SplitShare_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "SplitMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "SplitMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "SplitMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
