import { z } from 'zod';

/** Integer minor units as a digit string (optional leading minus). */
export const minorUnitsSchema = z
  .string()
  .regex(/^-?\d+$/, 'Must be an integer minor-units string');

export const currencyCodeSchema = z
  .string()
  .trim()
  .length(3)
  .regex(/^[A-Za-z]{3}$/, 'Must be a 3-letter ISO 4217 currency code')
  .transform((v) => v.toUpperCase());

export const accountMemberRoleSchema = z.enum(['OWNER', 'MEMBER']);
export type AccountMemberRole = z.infer<typeof accountMemberRoleSchema>;

export const createAccountSchema = z.object({
  walletId: z.uuid(),
  name: z.string().trim().min(1).max(100),
  currency: currencyCodeSchema,
  openingBalanceMinor: minorUnitsSchema,
  isShared: z.boolean().default(false),
});
export type CreateAccountDto = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type UpdateAccountDto = z.infer<typeof updateAccountSchema>;

export const addAccountMemberSchema = z.object({
  email: z.email().max(320),
});
export type AddAccountMemberDto = z.infer<typeof addAccountMemberSchema>;

export const publicAccountMemberSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  displayName: z.string(),
  role: accountMemberRoleSchema,
});
export type PublicAccountMember = z.infer<typeof publicAccountMemberSchema>;

export const publicAccountSchema = z.object({
  id: z.uuid(),
  walletId: z.uuid(),
  name: z.string(),
  currency: z.string().length(3),
  openingBalanceMinor: minorUnitsSchema,
  balanceMinor: minorUnitsSchema,
  isShared: z.boolean(),
  members: z.array(publicAccountMemberSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PublicAccount = z.infer<typeof publicAccountSchema>;
