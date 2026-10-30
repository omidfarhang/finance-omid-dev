import type { CategoryKind, PrismaClient } from '../generated/prisma/client';
import { Prisma } from '../generated/prisma/client';

export const UNCATEGORIZED_NAME = 'Uncategorized';

type DefaultCategory = {
  kind: CategoryKind;
  name: string;
  isSystem: boolean;
};

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { kind: 'INCOME', name: UNCATEGORIZED_NAME, isSystem: true },
  { kind: 'INCOME', name: 'Salary', isSystem: false },
  { kind: 'INCOME', name: 'Other', isSystem: false },
  { kind: 'EXPENSE', name: UNCATEGORIZED_NAME, isSystem: true },
  { kind: 'EXPENSE', name: 'Food', isSystem: false },
  { kind: 'EXPENSE', name: 'Transport', isSystem: false },
  { kind: 'EXPENSE', name: 'Housing', isSystem: false },
  { kind: 'EXPENSE', name: 'Utilities', isSystem: false },
  { kind: 'EXPENSE', name: 'Health', isSystem: false },
  { kind: 'EXPENSE', name: 'Shopping', isSystem: false },
  { kind: 'EXPENSE', name: 'Other', isSystem: false },
] as const;

type Db = PrismaClient | Prisma.TransactionClient;

/** Idempotent seed of default income/expense categories for a user. */
export async function ensureDefaultCategories(
  db: Db,
  userId: string,
): Promise<void> {
  const existing = await db.category.findMany({
    where: { userId },
    select: { kind: true, name: true },
  });
  const have = new Set(existing.map((c) => `${c.kind}:${c.name}`));
  const missing = DEFAULT_CATEGORIES.filter(
    (d) => !have.has(`${d.kind}:${d.name}`),
  );
  if (missing.length === 0) {
    return;
  }
  await db.category.createMany({
    data: missing.map((d) => ({
      userId,
      kind: d.kind,
      name: d.name,
      isSystem: d.isSystem,
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
      name: UNCATEGORIZED_NAME,
      isSystem: true,
    },
  });
  if (!category) {
    throw new Error(`Missing system Uncategorized category for ${kind}`);
  }
  return category.id;
}
