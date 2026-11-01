-- AlterEnum RecurringType
ALTER TYPE "RecurringType" ADD VALUE 'TRANSFER';

-- AlterEnum RecurringInterval (keep MONTHLY; add others)
ALTER TYPE "RecurringInterval" ADD VALUE 'DAILY';
ALTER TYPE "RecurringInterval" ADD VALUE 'WEEKLY';
ALTER TYPE "RecurringInterval" ADD VALUE 'YEARLY';

-- CreateEnum MonthAnchor
CREATE TYPE "MonthAnchor" AS ENUM ('DAY', 'FIRST', 'LAST');

-- AlterTable RecurringRule
ALTER TABLE "RecurringRule" ADD COLUMN "categoryId" UUID,
ADD COLUMN "monthAnchor" "MonthAnchor" NOT NULL DEFAULT 'DAY',
ADD COLUMN "anchorMonth" INTEGER,
ADD COLUMN "weekday" INTEGER,
ADD COLUMN "fromAccountId" UUID,
ADD COLUMN "toAccountId" UUID;

ALTER TABLE "RecurringRule" ALTER COLUMN "anchorDay" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "RecurringRule_categoryId_idx" ON "RecurringRule"("categoryId");
CREATE INDEX "RecurringRule_fromAccountId_idx" ON "RecurringRule"("fromAccountId");
CREATE INDEX "RecurringRule_toAccountId_idx" ON "RecurringRule"("toAccountId");

-- AddForeignKey
ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
