-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "RecurringInterval" AS ENUM ('MONTHLY');

-- CreateTable
CREATE TABLE "RecurringRule" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "RecurringType" NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "description" TEXT,
    "interval" "RecurringInterval" NOT NULL DEFAULT 'MONTHLY',
    "anchorDay" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringRule_userId_active_idx" ON "RecurringRule"("userId", "active");

-- AddForeignKey
ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
