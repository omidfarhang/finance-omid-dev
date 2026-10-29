import type { PublicUser } from '@finance/shared';
import type { User } from '@prisma/client';

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    locale: user.locale,
    timeZone: user.timeZone,
    totpEnabled: user.totpEnabled,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
