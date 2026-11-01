import { z } from 'zod';

export const importAdapterIdSchema = z.enum(['generic_csv', 'blubank_xlsx']);
export type ImportAdapterId = z.infer<typeof importAdapterIdSchema>;

export const publicImportAdapterSchema = z.object({
  id: importAdapterIdSchema,
  label: z.string(),
  /** Public web path to a synthetic sample file for this adapter (e.g. `/samples/generic_csv.csv`). */
  samplePath: z.string().min(1),
});
export type PublicImportAdapter = z.infer<typeof publicImportAdapterSchema>;

export const publicImportBatchSchema = z.object({
  id: z.uuid(),
  accountId: z.uuid(),
  adapterId: importAdapterIdSchema,
  originalFilename: z.string(),
  createdCount: z.number().int().nonnegative(),
  skippedDuplicateCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
});
export type PublicImportBatch = z.infer<typeof publicImportBatchSchema>;

export const importResultSchema = z.object({
  batch: publicImportBatchSchema,
  created: z.number().int().nonnegative(),
  skippedDuplicate: z.number().int().nonnegative(),
});
export type ImportResult = z.infer<typeof importResultSchema>;
