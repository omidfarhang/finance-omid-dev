-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('INCOME', 'EXPENSE');

-- AlterTable Category: typed lists + system flag
ALTER TABLE "Category" ADD COLUMN "kind" "CategoryKind" NOT NULL DEFAULT 'EXPENSE';
ALTER TABLE "Category" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX "Category_userId_name_key";

-- Existing "Uncategorized" rows become the expense system default
UPDATE "Category"
SET "isSystem" = true
WHERE name = 'Uncategorized';

CREATE UNIQUE INDEX "Category_userId_kind_name_key" ON "Category"("userId", "kind", "name");
CREATE INDEX "Category_userId_kind_idx" ON "Category"("userId", "kind");

-- Seed defaults for every user (skip names that already exist for that kind)
INSERT INTO "Category" ("id", "userId", "kind", "name", "isSystem", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", d.kind::"CategoryKind", d.name, d."isSystem", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN (
  VALUES
    ('INCOME', 'Uncategorized', true),
    ('INCOME', 'Salary', false),
    ('INCOME', 'Other', false),
    ('EXPENSE', 'Uncategorized', true),
    ('EXPENSE', 'Food', false),
    ('EXPENSE', 'Transport', false),
    ('EXPENSE', 'Housing', false),
    ('EXPENSE', 'Utilities', false),
    ('EXPENSE', 'Health', false),
    ('EXPENSE', 'Shopping', false),
    ('EXPENSE', 'Other', false)
) AS d(kind, name, "isSystem")
WHERE NOT EXISTS (
  SELECT 1 FROM "Category" c
  WHERE c."userId" = u."id" AND c."kind" = d.kind::"CategoryKind" AND c."name" = d.name
);

-- Mark Uncategorized rows as system (covers seeded + pre-existing expense Uncategorized)
UPDATE "Category"
SET "isSystem" = true
WHERE name = 'Uncategorized';

-- Assign Uncategorized when income/expense rows lack a category
UPDATE "Transaction" t
SET "categoryId" = c."id"
FROM "Category" c
WHERE t."categoryId" IS NULL
  AND t."type" = 'INCOME'
  AND c."userId" = t."createdByUserId"
  AND c."kind" = 'INCOME'
  AND c."name" = 'Uncategorized';

UPDATE "Transaction" t
SET "categoryId" = c."id"
FROM "Category" c
WHERE t."categoryId" IS NULL
  AND t."type" = 'EXPENSE'
  AND c."userId" = t."createdByUserId"
  AND c."kind" = 'EXPENSE'
  AND c."name" = 'Uncategorized';

-- Reassign income rows whose category kind does not match
UPDATE "Transaction" t
SET "categoryId" = unc."id"
FROM "Category" cat, "Category" unc
WHERE t."type" = 'INCOME'
  AND t."categoryId" = cat."id"
  AND cat."kind" <> 'INCOME'
  AND unc."userId" = t."createdByUserId"
  AND unc."kind" = 'INCOME'
  AND unc."name" = 'Uncategorized';

UPDATE "Transaction" t
SET "categoryId" = unc."id"
FROM "Category" cat, "Category" unc
WHERE t."type" = 'EXPENSE'
  AND t."categoryId" = cat."id"
  AND cat."kind" <> 'EXPENSE'
  AND unc."userId" = t."createdByUserId"
  AND unc."kind" = 'EXPENSE'
  AND unc."name" = 'Uncategorized';

-- Prevent deleting categories that are still referenced
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_categoryId_fkey";
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Category" ALTER COLUMN "kind" DROP DEFAULT;
