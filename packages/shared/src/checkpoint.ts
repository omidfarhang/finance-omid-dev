import { z } from 'zod';
import { minorUnitsSchema } from './account';

export const createCheckpointSchema = z.object({
  asOf: z.iso.datetime(),
  balanceMinor: minorUnitsSchema,
  note: z.string().trim().max(500).optional().nullable(),
});
export type CreateCheckpointDto = z.infer<typeof createCheckpointSchema>;

export const updateCheckpointSchema = z
  .object({
    asOf: z.iso.datetime().optional(),
    balanceMinor: minorUnitsSchema.optional(),
    note: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (v) =>
      v.asOf !== undefined ||
      v.balanceMinor !== undefined ||
      v.note !== undefined,
    { message: 'At least one field is required' },
  );
export type UpdateCheckpointDto = z.infer<typeof updateCheckpointSchema>;

export const publicCheckpointSchema = z.object({
  id: z.uuid(),
  accountId: z.uuid(),
  asOf: z.iso.datetime(),
  balanceMinor: minorUnitsSchema,
  note: z.string().nullable(),
  /** Ledger balance implied by previous checkpoint + movements in the window; null for earliest. */
  computedBalanceMinor: minorUnitsSchema.nullable(),
  /** recorded − computed; null for earliest (anchor). */
  gapMinor: minorUnitsSchema.nullable(),
  createdByUserId: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PublicCheckpoint = z.infer<typeof publicCheckpointSchema>;
