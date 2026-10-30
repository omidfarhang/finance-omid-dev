import type { AdminUser, PublicUser } from '@finance/shared';
import type { User } from '../generated/prisma/client';

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    locale: user.locale,
    timeZone: user.timeZone,
    calendar: user.calendar,
    totpEnabled: user.totpEnabled,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toAdminUser(user: User): AdminUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    disabledAt: user.disabledAt ? user.disabledAt.toISOString() : null,
    totpEnabled: user.totpEnabled,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
