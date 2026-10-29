import type { PublicWallet } from '@finance/shared';
import type { Wallet } from '@prisma/client';

export function toPublicWallet(wallet: Wallet): PublicWallet {
  return {
    id: wallet.id,
    name: wallet.name,
    ownerUserId: wallet.ownerUserId,
    createdAt: wallet.createdAt.toISOString(),
    updatedAt: wallet.updatedAt.toISOString(),
  };
}
