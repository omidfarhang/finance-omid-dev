import { z } from 'zod';

export const createWalletSchema = z.object({
  name: z.string().trim().min(1).max(100).default('Personal'),
});
export type CreateWalletDto = z.infer<typeof createWalletSchema>;

export const updateWalletSchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type UpdateWalletDto = z.infer<typeof updateWalletSchema>;

export const publicWalletSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  ownerUserId: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PublicWallet = z.infer<typeof publicWalletSchema>;
