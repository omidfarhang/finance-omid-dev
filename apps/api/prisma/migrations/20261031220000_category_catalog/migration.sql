-- Category catalog: TRANSFER kind, code/icon/color, expanded system defaults

ALTER TYPE "CategoryKind" ADD VALUE IF NOT EXISTS 'TRANSFER';

ALTER TABLE "Category"
  ADD COLUMN IF NOT EXISTS "code" TEXT,
  ADD COLUMN IF NOT EXISTS "icon" TEXT,
  ADD COLUMN IF NOT EXISTS "color" TEXT;

-- Map legacy English seed names → catalog codes (+ rename Food → Groceries)
UPDATE "Category" SET
  "code" = 'uncategorized',
  "icon" = 'pi-tag',
  "color" = 'slate',
  "isSystem" = true
WHERE "name" = 'Uncategorized' AND "code" IS NULL;

UPDATE "Category" SET
  "code" = 'salary',
  "icon" = 'pi-wallet',
  "color" = 'emerald',
  "isSystem" = true
WHERE "kind" = 'INCOME' AND "name" = 'Salary' AND "code" IS NULL;

UPDATE "Category" SET
  "code" = 'other',
  "icon" = 'pi-ellipsis-h',
  "color" = 'slate',
  "isSystem" = true
WHERE "name" = 'Other' AND "code" IS NULL AND "kind" IN ('INCOME', 'EXPENSE');

UPDATE "Category" SET
  "code" = 'groceries',
  "name" = 'Groceries',
  "icon" = 'pi-shopping-cart',
  "color" = 'lime',
  "isSystem" = true
WHERE "kind" = 'EXPENSE' AND "name" = 'Food' AND "code" IS NULL;

UPDATE "Category" SET
  "code" = 'transport',
  "icon" = 'pi-car',
  "color" = 'blue',
  "isSystem" = true
WHERE "kind" = 'EXPENSE' AND "name" = 'Transport' AND "code" IS NULL;

UPDATE "Category" SET
  "code" = 'housing',
  "icon" = 'pi-home',
  "color" = 'violet',
  "isSystem" = true
WHERE "kind" = 'EXPENSE' AND "name" = 'Housing' AND "code" IS NULL;

UPDATE "Category" SET
  "code" = 'utilities',
  "icon" = 'pi-wrench',
  "color" = 'cyan',
  "isSystem" = true
WHERE "kind" = 'EXPENSE' AND "name" = 'Utilities' AND "code" IS NULL;

UPDATE "Category" SET
  "code" = 'health',
  "icon" = 'pi-heart',
  "color" = 'red',
  "isSystem" = true
WHERE "kind" = 'EXPENSE' AND "name" = 'Health' AND "code" IS NULL;

UPDATE "Category" SET
  "code" = 'shopping',
  "icon" = 'pi-shopping-bag',
  "color" = 'pink',
  "isSystem" = true
WHERE "kind" = 'EXPENSE' AND "name" = 'Shopping' AND "code" IS NULL;

-- Orphan / user-renamed rows: default icon + color, remain non-system
UPDATE "Category" SET
  "icon" = COALESCE("icon", 'pi-tag'),
  "color" = COALESCE("color", 'slate')
WHERE "icon" IS NULL OR "color" IS NULL;

-- Insert full catalog for every user (skip existing kind+code or kind+name)
INSERT INTO "Category" ("id", "userId", "kind", "name", "code", "icon", "color", "isSystem", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", v.kind::"CategoryKind", v.name, v.code, v.icon, v.color, true, NOW(), NOW()
FROM "User" u
CROSS JOIN (
  VALUES
    ('INCOME', 'uncategorized', 'Uncategorized', 'pi-tag', 'slate'),
    ('INCOME', 'salary', 'Salary', 'pi-wallet', 'emerald'),
    ('INCOME', 'freelance', 'Freelance', 'pi-briefcase', 'cyan'),
    ('INCOME', 'business', 'Business', 'pi-building', 'blue'),
    ('INCOME', 'investments', 'Investments', 'pi-chart-line', 'violet'),
    ('INCOME', 'interest', 'Interest', 'pi-percentage', 'lime'),
    ('INCOME', 'rental', 'Rental', 'pi-home', 'orange'),
    ('INCOME', 'gifts', 'Gifts', 'pi-gift', 'pink'),
    ('INCOME', 'refunds', 'Refunds', 'pi-replay', 'amber'),
    ('INCOME', 'bonus', 'Bonus', 'pi-star', 'amber'),
    ('INCOME', 'other', 'Other', 'pi-ellipsis-h', 'slate'),
    ('EXPENSE', 'uncategorized', 'Uncategorized', 'pi-tag', 'slate'),
    ('EXPENSE', 'groceries', 'Groceries', 'pi-shopping-cart', 'lime'),
    ('EXPENSE', 'dining', 'Dining', 'pi-coffee', 'orange'),
    ('EXPENSE', 'transport', 'Transport', 'pi-car', 'blue'),
    ('EXPENSE', 'fuel', 'Fuel', 'pi-bolt', 'amber'),
    ('EXPENSE', 'housing', 'Housing', 'pi-home', 'violet'),
    ('EXPENSE', 'utilities', 'Utilities', 'pi-wrench', 'cyan'),
    ('EXPENSE', 'telecom', 'Telecom', 'pi-wifi', 'blue'),
    ('EXPENSE', 'health', 'Health', 'pi-heart', 'red'),
    ('EXPENSE', 'insurance', 'Insurance', 'pi-shield', 'emerald'),
    ('EXPENSE', 'shopping', 'Shopping', 'pi-shopping-bag', 'pink'),
    ('EXPENSE', 'clothing', 'Clothing', 'pi-shop', 'violet'),
    ('EXPENSE', 'entertainment', 'Entertainment', 'pi-ticket', 'pink'),
    ('EXPENSE', 'subscriptions', 'Subscriptions', 'pi-calendar', 'cyan'),
    ('EXPENSE', 'education', 'Education', 'pi-book', 'blue'),
    ('EXPENSE', 'travel', 'Travel', 'pi-map', 'orange'),
    ('EXPENSE', 'personal_care', 'Personal Care', 'pi-user', 'amber'),
    ('EXPENSE', 'pets', 'Pets', 'pi-paw', 'lime'),
    ('EXPENSE', 'family', 'Family', 'pi-users', 'pink'),
    ('EXPENSE', 'taxes', 'Taxes', 'pi-file', 'red'),
    ('EXPENSE', 'fees', 'Fees', 'pi-credit-card', 'slate'),
    ('EXPENSE', 'charity', 'Charity', 'pi-heart-fill', 'red'),
    ('EXPENSE', 'other', 'Other', 'pi-ellipsis-h', 'slate'),
    ('TRANSFER', 'uncategorized', 'Uncategorized', 'pi-tag', 'slate'),
    ('TRANSFER', 'savings', 'Savings', 'pi-inbox', 'emerald'),
    ('TRANSFER', 'investments', 'Investments', 'pi-chart-line', 'violet'),
    ('TRANSFER', 'debt_payment', 'Debt Payment', 'pi-credit-card', 'red'),
    ('TRANSFER', 'cash', 'Cash', 'pi-money-bill', 'amber'),
    ('TRANSFER', 'between_accounts', 'Between Accounts', 'pi-arrow-right-arrow-left', 'blue'),
    ('TRANSFER', 'other', 'Other', 'pi-ellipsis-h', 'slate')
) AS v(kind, code, name, icon, color)
WHERE NOT EXISTS (
  SELECT 1 FROM "Category" c
  WHERE c."userId" = u."id" AND c."kind" = v.kind::"CategoryKind" AND c."code" = v.code
)
AND NOT EXISTS (
  SELECT 1 FROM "Category" c
  WHERE c."userId" = u."id" AND c."kind" = v.kind::"CategoryKind" AND c."name" = v.name
);

-- Adopt same-name user rows that blocked insert (set code/icon/color/system)
UPDATE "Category" c SET
  "code" = v.code,
  "icon" = v.icon,
  "color" = v.color,
  "isSystem" = true
FROM (
  VALUES
    ('INCOME', 'uncategorized', 'Uncategorized', 'pi-tag', 'slate'),
    ('INCOME', 'salary', 'Salary', 'pi-wallet', 'emerald'),
    ('INCOME', 'freelance', 'Freelance', 'pi-briefcase', 'cyan'),
    ('INCOME', 'business', 'Business', 'pi-building', 'blue'),
    ('INCOME', 'investments', 'Investments', 'pi-chart-line', 'violet'),
    ('INCOME', 'interest', 'Interest', 'pi-percentage', 'lime'),
    ('INCOME', 'rental', 'Rental', 'pi-home', 'orange'),
    ('INCOME', 'gifts', 'Gifts', 'pi-gift', 'pink'),
    ('INCOME', 'refunds', 'Refunds', 'pi-replay', 'amber'),
    ('INCOME', 'bonus', 'Bonus', 'pi-star', 'amber'),
    ('INCOME', 'other', 'Other', 'pi-ellipsis-h', 'slate'),
    ('EXPENSE', 'uncategorized', 'Uncategorized', 'pi-tag', 'slate'),
    ('EXPENSE', 'groceries', 'Groceries', 'pi-shopping-cart', 'lime'),
    ('EXPENSE', 'dining', 'Dining', 'pi-coffee', 'orange'),
    ('EXPENSE', 'transport', 'Transport', 'pi-car', 'blue'),
    ('EXPENSE', 'fuel', 'Fuel', 'pi-bolt', 'amber'),
    ('EXPENSE', 'housing', 'Housing', 'pi-home', 'violet'),
    ('EXPENSE', 'utilities', 'Utilities', 'pi-wrench', 'cyan'),
    ('EXPENSE', 'telecom', 'Telecom', 'pi-wifi', 'blue'),
    ('EXPENSE', 'health', 'Health', 'pi-heart', 'red'),
    ('EXPENSE', 'insurance', 'Insurance', 'pi-shield', 'emerald'),
    ('EXPENSE', 'shopping', 'Shopping', 'pi-shopping-bag', 'pink'),
    ('EXPENSE', 'clothing', 'Clothing', 'pi-shop', 'violet'),
    ('EXPENSE', 'entertainment', 'Entertainment', 'pi-ticket', 'pink'),
    ('EXPENSE', 'subscriptions', 'Subscriptions', 'pi-calendar', 'cyan'),
    ('EXPENSE', 'education', 'Education', 'pi-book', 'blue'),
    ('EXPENSE', 'travel', 'Travel', 'pi-map', 'orange'),
    ('EXPENSE', 'personal_care', 'Personal Care', 'pi-user', 'amber'),
    ('EXPENSE', 'pets', 'Pets', 'pi-paw', 'lime'),
    ('EXPENSE', 'family', 'Family', 'pi-users', 'pink'),
    ('EXPENSE', 'taxes', 'Taxes', 'pi-file', 'red'),
    ('EXPENSE', 'fees', 'Fees', 'pi-credit-card', 'slate'),
    ('EXPENSE', 'charity', 'Charity', 'pi-heart-fill', 'red'),
    ('EXPENSE', 'other', 'Other', 'pi-ellipsis-h', 'slate'),
    ('TRANSFER', 'uncategorized', 'Uncategorized', 'pi-tag', 'slate'),
    ('TRANSFER', 'savings', 'Savings', 'pi-inbox', 'emerald'),
    ('TRANSFER', 'investments', 'Investments', 'pi-chart-line', 'violet'),
    ('TRANSFER', 'debt_payment', 'Debt Payment', 'pi-credit-card', 'red'),
    ('TRANSFER', 'cash', 'Cash', 'pi-money-bill', 'amber'),
    ('TRANSFER', 'between_accounts', 'Between Accounts', 'pi-arrow-right-arrow-left', 'blue'),
    ('TRANSFER', 'other', 'Other', 'pi-ellipsis-h', 'slate')
) AS v(kind, code, name, icon, color)
WHERE c."kind" = v.kind::"CategoryKind"
  AND c."name" = v.name
  AND c."code" IS NULL;

-- Backfill TRANSFER transactions → TRANSFER Uncategorized for the movement creator
UPDATE "Transaction" t
SET "categoryId" = c."id"
FROM "Category" c
WHERE t."type" = 'TRANSFER'
  AND t."categoryId" IS NULL
  AND c."userId" = t."createdByUserId"
  AND c."kind" = 'TRANSFER'
  AND c."code" = 'uncategorized';

ALTER TABLE "Category" ALTER COLUMN "icon" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "color" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Category_userId_kind_code_key"
  ON "Category" ("userId", "kind", "code");
