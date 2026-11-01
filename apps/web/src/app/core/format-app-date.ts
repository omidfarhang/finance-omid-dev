import {
  DEFAULT_BOUNDS_TIME_ZONE,
  civilDateToUtcMidnight,
  type CalendarSystem,
} from '@finance/shared';

function parseInstant(
  iso: string | Date | null | undefined,
): Date | null {
  if (iso == null || iso === '') {
    return null;
  }
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function formatInstant(
  iso: string | Date | null | undefined,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = parseInstant(iso);
  if (!date) {
    return '';
  }
  const tz = timeZone?.trim() || DEFAULT_BOUNDS_TIME_ZONE;
  const opts: Intl.DateTimeFormatOptions = {
    ...options,
    timeZone: tz,
  };
  if (calendar === 'JALALI') {
    opts.calendar = 'persian';
  }
  try {
    return new Intl.DateTimeFormat(locale, opts).format(date);
  } catch {
    return date.toISOString();
  }
}

/** Format an ISO instant for lists using the user calendar + timezone. */
export function formatAppDateTime(
  iso: string | Date | null | undefined,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
  locale: string,
): string {
  return formatInstant(iso, calendar, timeZone, locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Date-only label for day group headers. */
export function formatAppDate(
  iso: string | Date | null | undefined,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
  locale: string,
): string {
  return formatInstant(iso, calendar, timeZone, locale, {
    dateStyle: 'medium',
  });
}

/** Time-only label inside a day group. */
export function formatAppTime(
  iso: string | Date | null | undefined,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
  locale: string,
): string {
  return formatInstant(iso, calendar, timeZone, locale, {
    timeStyle: 'short',
  });
}

/** Format a calendar year/month label (e.g. Outlook header). */
export function formatCalendarMonthLabel(
  year: number,
  month: number,
  calendar: CalendarSystem,
  locale: string,
): string {
  const mid = civilDateToUtcMidnight(
    { year, month, day: 15 },
    calendar,
    'UTC',
  );
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  };
  if (calendar === 'JALALI') {
    options.calendar = 'persian';
  }
  try {
    return new Intl.DateTimeFormat(locale, options).format(mid);
  } catch {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}
