import type { PublicTransaction } from '@finance/shared';
import type { Category, Transaction } from '../generated/prisma/client';
import { minorUnitsToString } from '../accounts/accounts.mapper';

type TransactionWithCategory = Transaction & {
  category: Category | null;
};

export function toPublicTransaction(
  tx: TransactionWithCategory,
): PublicTransaction {
  return {
    id: tx.id,
    type: tx.type,
    accountId: tx.accountId,
    counterAccountId: tx.counterAccountId,
    amountMinor: minorUnitsToString(tx.amountMinor),
    occurredAt: tx.occurredAt.toISOString(),
    description: tx.description,
    categoryId: tx.categoryId,
    categoryName: tx.category?.name ?? null,
    shared: tx.shared,
    transferGroupId: tx.transferGroupId,
    createdByUserId: tx.createdByUserId,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  };
}
