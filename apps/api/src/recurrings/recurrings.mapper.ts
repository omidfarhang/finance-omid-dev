import type { PublicRecurring } from '@finance/shared';
import type { RecurringRule } from '../generated/prisma/client';
import { minorUnitsToString } from '../accounts/accounts.mapper';

export function toPublicRecurring(rule: RecurringRule): PublicRecurring {
  return {
    id: rule.id,
    type: rule.type,
    amountMinor: minorUnitsToString(rule.amountMinor),
    currency: rule.currency,
    description: rule.description,
    interval: rule.interval,
    anchorDay: rule.anchorDay,
    active: rule.active,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}
