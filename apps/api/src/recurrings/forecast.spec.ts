import { RecurringType } from '../generated/prisma/client';
import { buildNextMonthForecast } from './forecast';

describe('forecast', () => {
  it('computes next Gregorian month in UTC', () => {
    const forecast = buildNextMonthForecast([], {
      calendar: 'GREGORIAN',
      timeZone: 'UTC',
      from: new Date('2026-10-30T12:00:00.000Z'),
    });
    expect(forecast.calendar).toBe('GREGORIAN');
    expect(forecast.year).toBe(2026);
    expect(forecast.month).toBe(11);
  });

  it('rolls Gregorian December to next year', () => {
    const forecast = buildNextMonthForecast([], {
      calendar: 'GREGORIAN',
      timeZone: 'UTC',
      from: new Date('2026-12-01T00:00:00.000Z'),
    });
    expect(forecast.year).toBe(2027);
    expect(forecast.month).toBe(1);
  });

  it('computes next Jalali month for Asia/Tehran', () => {
    // Mid Esfand 1404 → next is Farvardin 1405
    const forecast = buildNextMonthForecast([], {
      calendar: 'JALALI',
      timeZone: 'Asia/Tehran',
      from: new Date('2026-03-05T12:00:00.000Z'),
    });
    expect(forecast.calendar).toBe('JALALI');
    expect(forecast.year).toBe(1405);
    expect(forecast.month).toBe(1);
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
      {
        calendar: 'GREGORIAN',
        timeZone: 'UTC',
        from: new Date('2026-10-15T00:00:00.000Z'),
      },
    );

    expect(forecast.projection).toBe(true);
    expect(forecast.calendar).toBe('GREGORIAN');
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
