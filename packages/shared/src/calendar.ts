import jalaali from 'jalaali-js';

/** Civil calendar systems for display, pickers, and month bounds. */
export const calendarSchemaValues = ['GREGORIAN', 'JALALI'] as const;
export type CalendarSystem = (typeof calendarSchemaValues)[number];

export const DEFAULT_CALENDAR: CalendarSystem = 'JALALI';
/** Used for month bounds when profile timeZone is unset. */
export const DEFAULT_BOUNDS_TIME_ZONE = 'UTC';

export type CivilDate = {
  year: number;
  month: number;
  day: number;
};

export type MonthBounds = {
  calendar: CalendarSystem;
  year: number;
  month: number;
  fromIso: string;
  /** Exclusive end of the month window (ISO instant). */
  toIso: string;
};

export type ZonedDateTimeParts = CivilDate & {
  hour: number;
  minute: number;
  second: number;
};

function resolveTimeZone(timeZone: string | null | undefined): string {
  return timeZone && timeZone.trim() ? timeZone.trim() : DEFAULT_BOUNDS_TIME_ZONE;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Wall-clock parts of an instant in an IANA timezone. */
export function getZonedParts(
  instant: Date,
  timeZone: string | null | undefined,
): ZonedDateTimeParts {
  const tz = resolveTimeZone(timeZone);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  });
  const parts = dtf.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((p) => p.type === type)?.value;
    if (value === undefined) {
      throw new Error(`Missing Intl part: ${type}`);
    }
    return Number(value);
  };
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/**
 * Convert civil Gregorian date-time in a timezone to a UTC Date.
 * Uses iterative offset correction (handles DST).
 */
export function zonedGregorianToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string | null | undefined,
): Date {
  const tz = resolveTimeZone(timeZone);
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let i = 0; i < 3; i++) {
    const seen = getZonedParts(new Date(utcMs), tz);
    const asIfUtc = Date.UTC(
      seen.year,
      seen.month - 1,
      seen.day,
      seen.hour,
      seen.minute,
      seen.second,
    );
    const desired = Date.UTC(year, month - 1, day, hour, minute, second);
    utcMs += desired - asIfUtc;
  }
  return new Date(utcMs);
}

/** Instant → civil date in the user's calendar + timezone. */
export function instantToCivilDate(
  instant: Date,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
): CivilDate {
  const g = getZonedParts(instant, timeZone);
  if (calendar === 'GREGORIAN') {
    return { year: g.year, month: g.month, day: g.day };
  }
  const j = jalaali.toJalaali(g.year, g.month, g.day);
  return { year: j.jy, month: j.jm, day: j.jd };
}

/** Civil date at local midnight in timezone → UTC Date. */
export function civilDateToUtcMidnight(
  civil: CivilDate,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
): Date {
  if (calendar === 'GREGORIAN') {
    return zonedGregorianToUtc(
      civil.year,
      civil.month,
      civil.day,
      0,
      0,
      0,
      timeZone,
    );
  }
  const g = jalaali.toGregorian(civil.year, civil.month, civil.day);
  return zonedGregorianToUtc(g.gy, g.gm, g.gd, 0, 0, 0, timeZone);
}

/** Combine civil date + time-of-day in timezone → UTC Date. */
export function civilDateTimeToUtc(
  civil: CivilDate,
  hour: number,
  minute: number,
  second: number,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
): Date {
  if (calendar === 'GREGORIAN') {
    return zonedGregorianToUtc(
      civil.year,
      civil.month,
      civil.day,
      hour,
      minute,
      second,
      timeZone,
    );
  }
  const g = jalaali.toGregorian(civil.year, civil.month, civil.day);
  return zonedGregorianToUtc(g.gy, g.gm, g.gd, hour, minute, second, timeZone);
}

function addOneMonth(civil: CivilDate, calendar: CalendarSystem): CivilDate {
  if (calendar === 'GREGORIAN') {
    if (civil.month === 12) {
      return { year: civil.year + 1, month: 1, day: 1 };
    }
    return { year: civil.year, month: civil.month + 1, day: 1 };
  }
  if (civil.month === 12) {
    return { year: civil.year + 1, month: 1, day: 1 };
  }
  return { year: civil.year, month: civil.month + 1, day: 1 };
}

function monthBoundsFromStart(
  startCivil: CivilDate,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
): MonthBounds {
  const next = addOneMonth(startCivil, calendar);
  const from = civilDateToUtcMidnight(startCivil, calendar, timeZone);
  const to = civilDateToUtcMidnight(next, calendar, timeZone);
  return {
    calendar,
    year: startCivil.year,
    month: startCivil.month,
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
  };
}

/** Inclusive start / exclusive end of the calendar month containing `instant`. */
export function currentMonthBounds(
  instant: Date,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
): MonthBounds {
  const civil = instantToCivilDate(instant, calendar, timeZone);
  return monthBoundsFromStart(
    { year: civil.year, month: civil.month, day: 1 },
    calendar,
    timeZone,
  );
}

/** Inclusive start / exclusive end of the next calendar month after `instant`. */
export function nextMonthBounds(
  instant: Date,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
): MonthBounds {
  const civil = instantToCivilDate(instant, calendar, timeZone);
  const next = addOneMonth(
    { year: civil.year, month: civil.month, day: 1 },
    calendar,
  );
  return monthBoundsFromStart(next, calendar, timeZone);
}

/** Days in a civil month (Jalali uses jalaali-js month length). */
export function daysInMonth(
  year: number,
  month: number,
  calendar: CalendarSystem,
): number {
  if (calendar === 'GREGORIAN') {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }
  return jalaali.jalaaliMonthLength(year, month);
}

export function formatCivilDate(civil: CivilDate): string {
  return `${civil.year}-${pad(civil.month)}-${pad(civil.day)}`;
}
