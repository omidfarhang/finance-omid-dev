import { RecurringType } from '../generated/prisma/client';
import { buildNextMonthForecast, nextUtcMonth } from './forecast';

describe('forecast', () => {
  it('computes next UTC month', () => {
    expect(nextUtcMonth(new Date('2026-10-30T12:00:00.000Z'))).toEqual({
      year: 2026,
      month: 11,
    });
    expect(nextUtcMonth(new Date('2026-12-01T00:00:00.000Z'))).toEqual({
      year: 2027,
      month: 1,
    });
  });

  it('aggregates active monthly rules per currency without mutating ledger state', () => {
    const forecast = buildNextMonthForecast(
      [
        {
          type: RecurringType.INCOME,
          amountMinor: 1000n,
          currency: 'IRR',
          active: true,
          interval: 'MONTHLY',
          anchorDay: 1,
        },
        {
          type: RecurringType.EXPENSE,
          amountMinor: 400n,
          currency: 'IRR',
          active: true,
          interval: 'MONTHLY',
          anchorDay: 5,
        },
        {
          type: RecurringType.EXPENSE,
          amountMinor: 50n,
          currency: 'USD',
          active: true,
          interval: 'MONTHLY',
          anchorDay: 10,
        },
        {
          type: RecurringType.INCOME,
          amountMinor: 999n,
          currency: 'IRR',
          active: false,
          interval: 'MONTHLY',
          anchorDay: 1,
        },
      ],
      new Date('2026-10-15T00:00:00.000Z'),
    );

    expect(forecast.projection).toBe(true);
    expect(forecast.year).toBe(2026);
    expect(forecast.month).toBe(11);
    expect(forecast.currencies).toEqual([
      {
        currency: 'IRR',
        expectedIncomeMinor: '1000',
        expectedExpenseMinor: '400',
        surplusMinor: '600',
      },
      {
        currency: 'USD',
        expectedIncomeMinor: '0',
        expectedExpenseMinor: '50',
        surplusMinor: '-50',
      },
    ]);
  });
});
