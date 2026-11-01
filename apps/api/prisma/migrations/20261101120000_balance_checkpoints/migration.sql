-- CreateTable
CREATE TABLE "BalanceCheckpoint" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "balanceMinor" BIGINT NOT NULL,
    "note" TEXT,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BalanceCheckpoint_pkey" PRIMARY KEY ("id")
);

-- Migrate opening balances to initial checkpoints (asOf = account.createdAt).
-- createdByUserId: prefer an OWNER member; otherwise any member.
INSERT INTO "BalanceCheckpoint" (
    "id",
    "accountId",
    "asOf",
    "balanceMinor",
    "note",
    "createdByUserId",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    a."id",
    a."createdAt",
    a."openingBalanceMinor",
    NULL,
    COALESCE(
        (
            SELECT m."userId"
            FROM "AccountMember" m
            WHERE m."accountId" = a."id" AND m."role" = 'OWNER'
            ORDER BY m."createdAt" ASC
            LIMIT 1
        ),
        (
            SELECT m."userId"
            FROM "AccountMember" m
            WHERE m."accountId" = a."id"
            ORDER BY m."createdAt" ASC
            LIMIT 1
        )
    ),
    a."createdAt",
    a."updatedAt"
FROM "Account" a;

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "openingBalanceMinor";

-- CreateIndex
CREATE INDEX "BalanceCheckpoint_accountId_asOf_idx" ON "BalanceCheckpoint"("accountId", "asOf");

-- CreateIndex
CREATE INDEX "BalanceCheckpoint_createdByUserId_idx" ON "BalanceCheckpoint"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "BalanceCheckpoint_accountId_asOf_key" ON "BalanceCheckpoint"("accountId", "asOf");

-- AddForeignKey
ALTER TABLE "BalanceCheckpoint" ADD CONSTRAINT "BalanceCheckpoint_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceCheckpoint" ADD CONSTRAINT "BalanceCheckpoint_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
