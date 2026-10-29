import { z } from 'zod';
import { userRoleSchema } from './user';

export const registrationStatusSchema = z.object({
  open: z.boolean(),
  bootstrapAllowed: z.boolean(),
});
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;

export const appSettingsSchema = z.object({
  registrationOpen: z.boolean(),
});
export type AppSettingsDto = z.infer<typeof appSettingsSchema>;

export const updateAppSettingsSchema = z.object({
  registrationOpen: z.boolean(),
});
export type UpdateAppSettingsDto = z.infer<typeof updateAppSettingsSchema>;

export const adminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  role: userRoleSchema,
  disabledAt: z.string().datetime().nullable(),
  totpEnabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const updateAdminUserSchema = z
  .object({
    role: userRoleSchema.optional(),
    disabled: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.disabled !== undefined, {
    message: 'At least one of role or disabled is required',
  });
export type UpdateAdminUserDto = z.infer<typeof updateAdminUserSchema>;
