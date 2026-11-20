-- Deleting a group removes its members and everything that points at them in one go (members are otherwise only ever hidden, never deleted).
ALTER TABLE "SplitExpense" DROP CONSTRAINT "SplitExpense_paidById_fkey";
ALTER TABLE "SplitExpense" ADD CONSTRAINT "SplitExpense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "SplitMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitShare" DROP CONSTRAINT "SplitShare_memberId_fkey";
ALTER TABLE "SplitShare" ADD CONSTRAINT "SplitShare_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "SplitMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitSettlement" DROP CONSTRAINT "SplitSettlement_fromMemberId_fkey";
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "SplitMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitSettlement" DROP CONSTRAINT "SplitSettlement_toMemberId_fkey";
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "SplitMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
