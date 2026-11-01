import type { PublicRecurring } from '@finance/shared';
import type { RecurringRule } from '../generated/prisma/client';
import { minorUnitsToString } from '../accounts/accounts.mapper';

export function toPublicRecurring(rule: RecurringRule): PublicRecurring {
  return {
    id: rule.id,
    type: rule.type,
    amountMinor: minorUnitsToString(rule.amountMinor),
    currency: rule.currency,
    categoryId: rule.categoryId,
    description: rule.description,
    interval: rule.interval,
    monthAnchor: rule.monthAnchor,
    anchorDay: rule.anchorDay,
    anchorMonth: rule.anchorMonth,
    weekday: rule.weekday,
    fromAccountId: rule.fromAccountId,
    toAccountId: rule.toAccountId,
    active: rule.active,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}
