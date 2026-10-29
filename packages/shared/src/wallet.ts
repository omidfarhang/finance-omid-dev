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
  id: z.string().uuid(),
  name: z.string(),
  ownerUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PublicWallet = z.infer<typeof publicWalletSchema>;
