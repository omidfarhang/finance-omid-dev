import { z } from 'zod';

export const userRoleSchema = z.enum(['USER', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  locale: z.string().trim().min(2).max(32).optional().nullable(),
  timeZone: z.string().trim().min(1).max(64).optional().nullable(),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const publicUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  role: userRoleSchema,
  locale: z.string().nullable(),
  timeZone: z.string().nullable(),
  totpEnabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;
