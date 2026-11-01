import { RecurringType } from '../generated/prisma/client';
import { buildNextMonthForecast, countOccurrencesInMonth } from './forecast';

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
          monthAnchor: 'DAY',
          anchorDay: 1,
          anchorMonth: null,
          weekday: null,
        },
        {
          type: RecurringType.EXPENSE,
          amountMinor: 400n,
          currency: 'IRR',
          active: true,
          interval: 'MONTHLY',
          monthAnchor: 'DAY',
          anchorDay: 5,
          anchorMonth: null,
          weekday: null,
        },
        {
          type: RecurringType.EXPENSE,
          amountMinor: 50n,
          currency: 'USD',
          active: true,
          interval: 'MONTHLY',
          monthAnchor: 'DAY',
          anchorDay: 10,
          anchorMonth: null,
          weekday: null,
        },
        {
          type: RecurringType.INCOME,
          amountMinor: 999n,
          currency: 'IRR',
          active: false,
          interval: 'MONTHLY',
          monthAnchor: 'DAY',
          anchorDay: 1,
          anchorMonth: null,
          weekday: null,
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

  it('counts DAILY as days in next month', () => {
    // Nov 2026 has 30 days
    const forecast = buildNextMonthForecast(
      [
        {
          type: RecurringType.EXPENSE,
          amountMinor: 10n,
          currency: 'USD',
          active: true,
          interval: 'DAILY',
          monthAnchor: 'DAY',
          anchorDay: null,
          anchorMonth: null,
          weekday: null,
        },
      ],
      {
        calendar: 'GREGORIAN',
        timeZone: 'UTC',
        from: new Date('2026-10-15T00:00:00.000Z'),
      },
    );
    expect(forecast.currencies[0]).toEqual({
      currency: 'USD',
      expectedIncomeMinor: '0',
      expectedExpenseMinor: '300',
      surplusMinor: '-300',
    });
  });

  it('counts WEEKLY weekdays in next month', () => {
    // Nov 2026 Sundays: 1,8,15,22,29 → 5
    expect(
      countOccurrencesInMonth(
        {
          interval: 'WEEKLY',
          monthAnchor: 'DAY',
          anchorDay: null,
          anchorMonth: null,
          weekday: 0,
        },
        2026,
        11,
        'GREGORIAN',
      ),
    ).toBe(5);

    const forecast = buildNextMonthForecast(
      [
        {
          type: RecurringType.EXPENSE,
          amountMinor: 100n,
          currency: 'EUR',
          active: true,
          interval: 'WEEKLY',
          monthAnchor: 'DAY',
          anchorDay: null,
          anchorMonth: null,
          weekday: 0,
        },
      ],
      {
        calendar: 'GREGORIAN',
        timeZone: 'UTC',
        from: new Date('2026-10-15T00:00:00.000Z'),
      },
    );
    expect(forecast.currencies[0]?.expectedExpenseMinor).toBe('500');
  });

  it('supports FIRST and LAST monthly anchors', () => {
    const forecast = buildNextMonthForecast(
      [
        {
          type: RecurringType.INCOME,
          amountMinor: 100n,
          currency: 'IRR',
          active: true,
          interval: 'MONTHLY',
          monthAnchor: 'FIRST',
          anchorDay: null,
          anchorMonth: null,
          weekday: null,
        },
        {
          type: RecurringType.EXPENSE,
          amountMinor: 40n,
          currency: 'IRR',
          active: true,
          interval: 'MONTHLY',
          monthAnchor: 'LAST',
          anchorDay: null,
          anchorMonth: null,
          weekday: null,
        },
      ],
      {
        calendar: 'GREGORIAN',
        timeZone: 'UTC',
        from: new Date('2026-10-15T00:00:00.000Z'),
      },
    );
    expect(forecast.currencies[0]).toMatchObject({
      expectedIncomeMinor: '100',
      expectedExpenseMinor: '40',
      surplusMinor: '60',
    });
  });

  it('counts YEARLY only when anchorMonth matches forecast month', () => {
    const nov = buildNextMonthForecast(
      [
        {
          type: RecurringType.EXPENSE,
          amountMinor: 250n,
          currency: 'USD',
          active: true,
          interval: 'YEARLY',
          monthAnchor: 'DAY',
          anchorDay: 15,
          anchorMonth: 11,
          weekday: null,
        },
        {
          type: RecurringType.EXPENSE,
          amountMinor: 999n,
          currency: 'USD',
          active: true,
          interval: 'YEARLY',
          monthAnchor: 'DAY',
          anchorDay: 1,
          anchorMonth: 3,
          weekday: null,
        },
      ],
      {
        calendar: 'GREGORIAN',
        timeZone: 'UTC',
        from: new Date('2026-10-15T00:00:00.000Z'),
      },
    );
    expect(nov.currencies[0]?.expectedExpenseMinor).toBe('250');
  });

  it('excludes TRANSFER rules from surplus', () => {
    const forecast = buildNextMonthForecast(
      [
        {
          type: RecurringType.INCOME,
          amountMinor: 100n,
          currency: 'IRR',
          active: true,
          interval: 'MONTHLY',
          monthAnchor: 'DAY',
          anchorDay: 1,
          anchorMonth: null,
          weekday: null,
        },
        {
          type: RecurringType.TRANSFER,
          amountMinor: 50n,
          currency: 'IRR',
          active: true,
          interval: 'MONTHLY',
          monthAnchor: 'DAY',
          anchorDay: 1,
          anchorMonth: null,
          weekday: null,
        },
      ],
      {
        calendar: 'GREGORIAN',
        timeZone: 'UTC',
        from: new Date('2026-10-15T00:00:00.000Z'),
      },
    );
    expect(forecast.currencies[0]).toEqual({
      currency: 'IRR',
      expectedIncomeMinor: '100',
      expectedExpenseMinor: '0',
      surplusMinor: '100',
    });
  });
});
