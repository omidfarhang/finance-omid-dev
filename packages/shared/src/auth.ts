import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(10).max(128),
  displayName: z.string().trim().min(1).max(100),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(1).max(128),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const totpCodeSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, 'TOTP code must be 6 digits'),
});
export type TotpCodeDto = z.infer<typeof totpCodeSchema>;

export const loginWithTotpSchema = loginSchema.merge(totpCodeSchema.partial());
export type LoginWithTotpDto = z.infer<typeof loginWithTotpSchema>;

export const completeTotpLoginSchema = totpCodeSchema.extend({
  pendingToken: z.uuid(),
});
export type CompleteTotpLoginDto = z.infer<typeof completeTotpLoginSchema>;
