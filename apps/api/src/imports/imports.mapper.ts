import type { PublicImportBatch } from '@finance/shared';
import type { ImportBatch } from '../generated/prisma/client';

export function toPublicImportBatch(batch: ImportBatch): PublicImportBatch {
  return {
    id: batch.id,
    accountId: batch.accountId,
    adapterId: batch.adapterId as PublicImportBatch['adapterId'],
    originalFilename: batch.originalFilename,
    createdCount: batch.createdCount,
    skippedDuplicateCount: batch.skippedDuplicateCount,
    createdAt: batch.createdAt.toISOString(),
  };
}
