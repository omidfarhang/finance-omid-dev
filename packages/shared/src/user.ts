import { z } from 'zod';
import {
  calendarSchemaValues,
  DEFAULT_CALENDAR,
  type CalendarSystem,
} from './calendar';
import {
  DEFAULT_THEME,
  themeSchemaValues,
  type ThemePreference,
} from './theme';

export const userRoleSchema = z.enum(['USER', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const calendarSchema = z.enum(calendarSchemaValues);
export type { CalendarSystem };
export { DEFAULT_CALENDAR };

export const themeSchema = z.enum(themeSchemaValues);
export type { ThemePreference };
export { DEFAULT_THEME };

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  locale: z.string().trim().min(2).max(32).optional().nullable(),
  timeZone: z.string().trim().min(1).max(64).optional().nullable(),
  calendar: calendarSchema.optional(),
  theme: themeSchema.optional(),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const publicUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string(),
  role: userRoleSchema,
  locale: z.string().nullable(),
  timeZone: z.string().nullable(),
  calendar: calendarSchema,
  theme: themeSchema,
  totpEnabled: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;
