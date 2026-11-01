import { TransactionType } from '../generated/prisma/client';

export type ParsedImportRow = {
  type: typeof TransactionType.INCOME | typeof TransactionType.EXPENSE;
  amountMinor: bigint;
  occurredAt: Date;
  description: string | null;
  dedupeKey: string;
};
