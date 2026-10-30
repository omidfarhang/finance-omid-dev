import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

export const publicCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PublicCategory = z.infer<typeof publicCategorySchema>;
