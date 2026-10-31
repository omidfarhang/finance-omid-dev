import { describe, expect, it } from 'vitest';
import {
  isDayOff,
  isIranOfficialHoliday,
  isWeekendDay,
  weekendWeekdayIndexes,
} from './iran-holidays';

describe('iran holidays / day-off', () => {
  it('marks Friday as Jalali weekend and Sat/Sun as Gregorian', () => {
    // 1405-01-01 = 2026-03-21 Saturday
    expect(isWeekendDay({ year: 1405, month: 1, day: 1 }, 'JALALI')).toBe(
      false,
    );
    // 1405-01-07 = Friday
    expect(isWeekendDay({ year: 1405, month: 1, day: 7 }, 'JALALI')).toBe(
      true,
    );
    expect(isWeekendDay({ year: 2026, month: 3, day: 21 }, 'GREGORIAN')).toBe(
      true,
    ); // Sat
    expect(isWeekendDay({ year: 2026, month: 3, day: 22 }, 'GREGORIAN')).toBe(
      true,
    ); // Sun
    expect(isWeekendDay({ year: 2026, month: 3, day: 23 }, 'GREGORIAN')).toBe(
      false,
    );
  });

  it('looks up Iran official holidays in Jalali years 1403–1406', () => {
    expect(
      isIranOfficialHoliday({ year: 1404, month: 1, day: 1 }, 'JALALI'),
    ).toBe(true);
    expect(
      isIranOfficialHoliday({ year: 1404, month: 11, day: 22 }, 'JALALI'),
    ).toBe(true);
    expect(
      isIranOfficialHoliday({ year: 1404, month: 1, day: 5 }, 'JALALI'),
    ).toBe(false);
    expect(
      isIranOfficialHoliday({ year: 1406, month: 1, day: 1 }, 'JALALI'),
    ).toBe(true);
    expect(
      isIranOfficialHoliday({ year: 1406, month: 3, day: 25 }, 'JALALI'),
    ).toBe(true);
    expect(
      isIranOfficialHoliday({ year: 1406, month: 2, day: 24 }, 'JALALI'),
    ).toBe(false);
  });

  it('resolves Iran holidays from Gregorian civil dates', () => {
    // 2025-03-21 ≈ 1404-01-01 Nowruz
    expect(
      isIranOfficialHoliday({ year: 2025, month: 3, day: 21 }, 'GREGORIAN'),
    ).toBe(true);
  });

  it('isDayOff combines weekend and holiday', () => {
    expect(isDayOff({ year: 1405, month: 1, day: 7 }, 'JALALI')).toBe(true);
    expect(isDayOff({ year: 1405, month: 1, day: 12 }, 'JALALI')).toBe(true);
    expect(isDayOff({ year: 1405, month: 1, day: 6 }, 'JALALI')).toBe(false);
  });

  it('weekendWeekdayIndexes matches calendar convention', () => {
    expect(weekendWeekdayIndexes('JALALI')).toEqual([5]);
    expect(weekendWeekdayIndexes('GREGORIAN')).toEqual([0, 6]);
  });
});
