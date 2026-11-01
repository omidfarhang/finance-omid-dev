import type { PublicCheckpoint } from '@finance/shared';
import type { BalanceCheckpoint } from '../generated/prisma/client';
import { minorUnitsToString } from './accounts.mapper';

export function toPublicCheckpoint(
  checkpoint: BalanceCheckpoint,
  computedBalanceMinor: bigint | null,
  gapMinor: bigint | null,
): PublicCheckpoint {
  return {
    id: checkpoint.id,
    accountId: checkpoint.accountId,
    asOf: checkpoint.asOf.toISOString(),
    balanceMinor: minorUnitsToString(checkpoint.balanceMinor),
    note: checkpoint.note,
    computedBalanceMinor:
      computedBalanceMinor === null
        ? null
        : minorUnitsToString(computedBalanceMinor),
    gapMinor: gapMinor === null ? null : minorUnitsToString(gapMinor),
    createdByUserId: checkpoint.createdByUserId,
    createdAt: checkpoint.createdAt.toISOString(),
    updatedAt: checkpoint.updatedAt.toISOString(),
  };
}
