import type {
  CategoryColorId,
  CategoryIconId,
} from '@finance/shared';
import type { CategoryKind, PrismaClient } from '../generated/prisma/client';
import { Prisma } from '../generated/prisma/client';

export const UNCATEGORIZED_CODE = 'uncategorized';
/** @deprecated Prefer UNCATEGORIZED_CODE; kept for legacy name lookups. */
export const UNCATEGORIZED_NAME = 'Uncategorized';

export type DefaultCategory = {
  kind: CategoryKind;
  code: string;
  name: string;
  icon: CategoryIconId;
  color: CategoryColorId;
  isSystem: true;
};

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  // INCOME
  {
    kind: 'INCOME',
    code: 'uncategorized',
    name: 'Uncategorized',
    icon: 'pi-tag',
    color: 'slate',
    isSystem: true,
  },
  {
    kind: 'INCOME',
    code: 'salary',
    name: 'Salary',
    icon: 'pi-wallet',
    color: 'emerald',
    isSystem: true,
  },
  {
    kind: 'INCOME',
    code: 'freelance',
    name: 'Freelance',
    icon: 'pi-briefcase',
    color: 'cyan',
    isSystem: true,
  },
  {
    kind: 'INCOME',
    code: 'business',
    name: 'Business',
    icon: 'pi-building',
    color: 'blue',
    isSystem: true,
  },
  {
    kind: 'INCOME',
    code: 'investments',
    name: 'Investments',
    icon: 'pi-chart-line',
    color: 'violet',
    isSystem: true,
  },
  {
    kind: 'INCOME',
    code: 'interest',
    name: 'Interest',
    icon: 'pi-percentage',
    color: 'lime',
    isSystem: true,
  },
  {
    kind: 'INCOME',
    code: 'rental',
    name: 'Rental',
    icon: 'pi-home',
    color: 'orange',
    isSystem: true,
  },
  {
    kind: 'INCOME',
    code: 'gifts',
    name: 'Gifts',
    icon: 'pi-gift',
    color: 'pink',
    isSystem: true,
  },
  {
    kind: 'INCOME',
    code: 'refunds',
    name: 'Refunds',
    icon: 'pi-replay',
    color: 'amber',
    isSystem: true,
  },
  {
    kind: 'INCOME',
    code: 'bonus',
    name: 'Bonus',
    icon: 'pi-star',
    color: 'amber',
    isSystem: true,
  },
  {
    kind: 'INCOME',
    code: 'other',
    name: 'Other',
    icon: 'pi-ellipsis-h',
    color: 'slate',
    isSystem: true,
  },
  // EXPENSE
  {
    kind: 'EXPENSE',
    code: 'uncategorized',
    name: 'Uncategorized',
    icon: 'pi-tag',
    color: 'slate',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'groceries',
    name: 'Groceries',
    icon: 'pi-shopping-cart',
    color: 'lime',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'dining',
    name: 'Dining',
    icon: 'pi-coffee',
    color: 'orange',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'transport',
    name: 'Transport',
    icon: 'pi-car',
    color: 'blue',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'fuel',
    name: 'Fuel',
    icon: 'pi-bolt',
    color: 'amber',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'housing',
    name: 'Housing',
    icon: 'pi-home',
    color: 'violet',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'utilities',
    name: 'Utilities',
    icon: 'pi-wrench',
    color: 'cyan',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'telecom',
    name: 'Telecom',
    icon: 'pi-wifi',
    color: 'blue',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'health',
    name: 'Health',
    icon: 'pi-heart',
    color: 'red',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'insurance',
    name: 'Insurance',
    icon: 'pi-shield',
    color: 'emerald',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'shopping',
    name: 'Shopping',
    icon: 'pi-shopping-bag',
    color: 'pink',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'clothing',
    name: 'Clothing',
    icon: 'pi-shop',
    color: 'violet',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'entertainment',
    name: 'Entertainment',
    icon: 'pi-ticket',
    color: 'pink',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'subscriptions',
    name: 'Subscriptions',
    icon: 'pi-calendar',
    color: 'cyan',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'education',
    name: 'Education',
    icon: 'pi-book',
    color: 'blue',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'travel',
    name: 'Travel',
    icon: 'pi-map',
    color: 'orange',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'personal_care',
    name: 'Personal Care',
    icon: 'pi-user',
    color: 'amber',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'pets',
    name: 'Pets',
    icon: 'pi-paw',
    color: 'lime',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'family',
    name: 'Family',
    icon: 'pi-users',
    color: 'pink',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'taxes',
    name: 'Taxes',
    icon: 'pi-file',
    color: 'red',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'fees',
    name: 'Fees',
    icon: 'pi-credit-card',
    color: 'slate',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'charity',
    name: 'Charity',
    icon: 'pi-heart-fill',
    color: 'red',
    isSystem: true,
  },
  {
    kind: 'EXPENSE',
    code: 'other',
    name: 'Other',
    icon: 'pi-ellipsis-h',
    color: 'slate',
    isSystem: true,
  },
  // TRANSFER
  {
    kind: 'TRANSFER',
    code: 'uncategorized',
    name: 'Uncategorized',
    icon: 'pi-tag',
    color: 'slate',
    isSystem: true,
  },
  {
    kind: 'TRANSFER',
    code: 'savings',
    name: 'Savings',
    icon: 'pi-inbox',
    color: 'emerald',
    isSystem: true,
  },
  {
    kind: 'TRANSFER',
    code: 'investments',
    name: 'Investments',
    icon: 'pi-chart-line',
    color: 'violet',
    isSystem: true,
  },
  {
    kind: 'TRANSFER',
    code: 'debt_payment',
    name: 'Debt Payment',
    icon: 'pi-credit-card',
    color: 'red',
    isSystem: true,
  },
  {
    kind: 'TRANSFER',
    code: 'cash',
    name: 'Cash',
    icon: 'pi-money-bill',
    color: 'amber',
    isSystem: true,
  },
  {
    kind: 'TRANSFER',
    code: 'between_accounts',
    name: 'Between Accounts',
    icon: 'pi-arrow-right-arrow-left',
    color: 'blue',
    isSystem: true,
  },
  {
    kind: 'TRANSFER',
    code: 'other',
    name: 'Other',
    icon: 'pi-ellipsis-h',
    color: 'slate',
    isSystem: true,
  },
] as const;

/** Legacy English names → new catalog codes (same kind). */
export const LEGACY_NAME_TO_CODE: Readonly<
  Record<string, Partial<Record<CategoryKind, string>>>
> = {
  Uncategorized: {
    INCOME: 'uncategorized',
    EXPENSE: 'uncategorized',
    TRANSFER: 'uncategorized',
  },
  Salary: { INCOME: 'salary' },
  Other: { INCOME: 'other', EXPENSE: 'other', TRANSFER: 'other' },
  Food: { EXPENSE: 'groceries' },
  Transport: { EXPENSE: 'transport' },
  Housing: { EXPENSE: 'housing' },
  Utilities: { EXPENSE: 'utilities' },
  Health: { EXPENSE: 'health' },
  Shopping: { EXPENSE: 'shopping' },
};

type Db = PrismaClient | Prisma.TransactionClient;

/** Idempotent seed of default categories for a user (match on kind+code). */
export async function ensureDefaultCategories(
  db: Db,
  userId: string,
): Promise<void> {
  const existing = await db.category.findMany({
    where: { userId },
    select: { kind: true, code: true },
  });
  const have = new Set(
    existing
      .filter((c) => c.code != null)
      .map((c) => `${c.kind}:${c.code}`),
  );
  const missing = DEFAULT_CATEGORIES.filter(
    (d) => !have.has(`${d.kind}:${d.code}`),
  );
  if (missing.length === 0) {
    return;
  }
  await db.category.createMany({
    data: missing.map((d) => ({
      userId,
      kind: d.kind,
      name: d.name,
      code: d.code,
      icon: d.icon,
      color: d.color,
      isSystem: true,
    })),
    skipDuplicates: true,
  });
}

export async function requireUncategorizedId(
  db: Db,
  userId: string,
  kind: CategoryKind,
): Promise<string> {
  await ensureDefaultCategories(db, userId);
  const category = await db.category.findFirst({
    where: {
      userId,
      kind,
      code: UNCATEGORIZED_CODE,
      isSystem: true,
    },
  });
  if (!category) {
    throw new Error(`Missing system Uncategorized category for ${kind}`);
  }
  return category.id;
}
