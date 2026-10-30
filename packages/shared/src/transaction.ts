import { z } from 'zod';
import { minorUnitsSchema } from './account';

export const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE', 'TRANSFER']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

/** Positive integer minor units as a digit string (no leading minus). */
export const positiveMinorUnitsSchema = z
  .string()
  .regex(/^\d+$/, 'Must be a non-negative integer minor-units string')
  .refine((v) => BigInt(v) > 0n, 'Amount must be greater than zero');

const baseCreateFields = {
  amountMinor: positiveMinorUnitsSchema,
  occurredAt: z.iso.datetime(),
  description: z.string().trim().max(500).optional().nullable(),
};

export const createIncomeExpenseSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  accountId: z.uuid(),
  categoryId: z.uuid().optional().nullable(),
  shared: z.boolean().optional().default(false),
  ...baseCreateFields,
});

export const createTransferSchema = z.object({
  type: z.literal('TRANSFER'),
  accountId: z.uuid(),
  counterAccountId: z.uuid(),
  ...baseCreateFields,
});

export const createTransactionSchema = z.discriminatedUnion('type', [
  createIncomeExpenseSchema,
  createTransferSchema,
]);
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = z.object({
  occurredAt: z.iso.datetime().optional(),
  description: z.string().trim().max(500).optional().nullable(),
  categoryId: z.uuid().optional().nullable(),
  shared: z.boolean().optional(),
});
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;

const emptyToUndefined = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : value;

export const listTransactionsQuerySchema = z.object({
  accountId: z.preprocess(emptyToUndefined, z.uuid().optional()),
  from: z.preprocess(emptyToUndefined, z.iso.datetime().optional()),
  to: z.preprocess(emptyToUndefined, z.iso.datetime().optional()),
  type: z.preprocess(emptyToUndefined, transactionTypeSchema.optional()),
});
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

export const publicTransactionSchema = z.object({
  id: z.uuid(),
  type: transactionTypeSchema,
  accountId: z.uuid(),
  counterAccountId: z.uuid().nullable(),
  amountMinor: minorUnitsSchema,
  occurredAt: z.iso.datetime(),
  description: z.string().nullable(),
  categoryId: z.uuid().nullable(),
  categoryName: z.string().nullable(),
  shared: z.boolean(),
  transferGroupId: z.uuid().nullable(),
  createdByUserId: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PublicTransaction = z.infer<typeof publicTransactionSchema>;
