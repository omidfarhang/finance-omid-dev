-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "importBatchId" UUID;

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "adapterId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "createdCount" INTEGER NOT NULL,
    "skippedDuplicateCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportBatch_userId_createdAt_idx" ON "ImportBatch"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportBatch_accountId_idx" ON "ImportBatch"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_importBatchId_idx" ON "Transaction"("importBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_accountId_dedupeKey_key" ON "Transaction"("accountId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
