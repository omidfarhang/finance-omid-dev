import type { PublicTransaction } from '@finance/shared';
import { civilDayKey, groupTransactionsByDay } from './activity-day-groups';

function tx(
  id: string,
  occurredAt: string,
  type: PublicTransaction['type'] = 'EXPENSE',
): PublicTransaction {
  return {
    id,
    type,
    accountId: '11111111-1111-1111-1111-111111111111',
    counterAccountId: null,
    amountMinor: '1000',
    occurredAt,
    description: null,
    categoryId: null,
    categoryName: null,
    categoryCode: null,
    categoryIcon: null,
    categoryColor: null,
    shared: false,
    transferGroupId: null,
    createdByUserId: '22222222-2222-2222-2222-222222222222',
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };
}

describe('civilDayKey', () => {
  it('zero-pads month and day', () => {
    expect(civilDayKey({ year: 1404, month: 8, day: 1 })).toBe('1404-08-01');
  });
});

describe('groupTransactionsByDay', () => {
  it('groups by Jalali civil day in Tehran and keeps newest day first', () => {
    // 2025-10-23 19:00 UTC = 1404-08-01 22:30 in Tehran
    const evening = tx('a', '2025-10-23T19:00:00.000Z');
    // 2025-10-22 21:00 UTC = 1404-08-01 00:30 in Tehran (same civil day)
    const morning = tx('b', '2025-10-22T21:00:00.000Z');
    // 2025-10-22 10:00 UTC = 1404-07-30 13:30 in Tehran
    const previous = tx('c', '2025-10-22T10:00:00.000Z');

    const groups = groupTransactionsByDay(
      [evening, morning, previous],
      'JALALI',
      'Asia/Tehran',
    );

    expect(groups.map((g) => g.key)).toEqual(['1404-08-01', '1404-07-30']);
    expect(groups[0].transactions.map((t) => t.id)).toEqual(['a', 'b']);
    expect(groups[1].transactions.map((t) => t.id)).toEqual(['c']);
  });

  it('uses Gregorian civil days in UTC', () => {
    const a = tx('a', '2025-03-01T12:00:00.000Z');
    const b = tx('b', '2025-02-28T23:00:00.000Z');
    const groups = groupTransactionsByDay([a, b], 'GREGORIAN', 'UTC');
    expect(groups.map((g) => g.key)).toEqual(['2025-03-01', '2025-02-28']);
  });
});
