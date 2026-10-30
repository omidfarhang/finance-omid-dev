import { z } from 'zod';

export const categoryKindSchema = z.enum(['INCOME', 'EXPENSE']);
export type CategoryKind = z.infer<typeof categoryKindSchema>;

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  kind: categoryKindSchema,
});
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

const emptyToUndefined = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : value;

export const listCategoriesQuerySchema = z.object({
  kind: z.preprocess(emptyToUndefined, categoryKindSchema.optional()),
});
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

export const publicCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  kind: categoryKindSchema,
  isSystem: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PublicCategory = z.infer<typeof publicCategorySchema>;
