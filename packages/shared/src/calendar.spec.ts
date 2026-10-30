import { describe, expect, it } from 'vitest';
import {
  currentMonthBounds,
  instantToCivilDate,
  nextMonthBounds,
  zonedGregorianToUtc,
} from './calendar';

describe('calendar helpers', () => {
  it('maps UTC Gregorian civil parts', () => {
    const civil = instantToCivilDate(
      new Date('2026-10-30T12:00:00.000Z'),
      'GREGORIAN',
      'UTC',
    );
    expect(civil).toEqual({ year: 2026, month: 10, day: 30 });
  });

  it('maps Asia/Tehran instant to Jalali civil date', () => {
    // 1405-01-01 = 2026-03-21 Gregorian
    const civil = instantToCivilDate(
      new Date('2026-03-21T12:00:00.000Z'),
      'JALALI',
      'Asia/Tehran',
    );
    expect(civil.year).toBe(1405);
    expect(civil.month).toBe(1);
  });

  it('computes Gregorian current and next month bounds in UTC', () => {
    const from = new Date('2026-10-30T12:00:00.000Z');
    const current = currentMonthBounds(from, 'GREGORIAN', 'UTC');
    expect(current).toMatchObject({
      calendar: 'GREGORIAN',
      year: 2026,
      month: 10,
      fromIso: '2026-10-01T00:00:00.000Z',
      toIso: '2026-11-01T00:00:00.000Z',
    });

    const next = nextMonthBounds(from, 'GREGORIAN', 'UTC');
    expect(next).toMatchObject({
      calendar: 'GREGORIAN',
      year: 2026,
      month: 11,
      fromIso: '2026-11-01T00:00:00.000Z',
      toIso: '2026-12-01T00:00:00.000Z',
    });
  });

  it('rolls Gregorian December to next year', () => {
    const next = nextMonthBounds(
      new Date('2026-12-01T00:00:00.000Z'),
      'GREGORIAN',
      'UTC',
    );
    expect(next).toMatchObject({ year: 2027, month: 1 });
  });

  it('rolls Jalali Esfand to Farvardin', () => {
    // 1404/12/15 ≈ mid Esfand 1404
    const midEsfand = zonedGregorianToUtc(2026, 3, 5, 12, 0, 0, 'Asia/Tehran');
    const civil = instantToCivilDate(midEsfand, 'JALALI', 'Asia/Tehran');
    expect(civil.month).toBe(12);
    expect(civil.year).toBe(1404);

    const next = nextMonthBounds(midEsfand, 'JALALI', 'Asia/Tehran');
    expect(next.year).toBe(1405);
    expect(next.month).toBe(1);
    expect(new Date(next.fromIso).getTime()).toBeLessThan(
      new Date(next.toIso).getTime(),
    );
  });

  it('uses UTC when timezone is unset', () => {
    const bounds = currentMonthBounds(
      new Date('2026-10-15T00:00:00.000Z'),
      'GREGORIAN',
      null,
    );
    expect(bounds.fromIso).toBe('2026-10-01T00:00:00.000Z');
    expect(bounds.toIso).toBe('2026-11-01T00:00:00.000Z');
  });
});
