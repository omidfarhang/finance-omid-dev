import {
  DEFAULT_BOUNDS_TIME_ZONE,
  civilDateToUtcMidnight,
  type CalendarSystem,
} from '@finance/shared';

/** Format an ISO instant for lists using the user calendar + timezone. */
export function formatAppDateTime(
  iso: string | Date | null | undefined,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
  locale: string,
): string {
  if (iso == null || iso === '') {
    return '';
  }
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const tz = timeZone?.trim() || DEFAULT_BOUNDS_TIME_ZONE;
  const options: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    dateStyle: 'medium',
    timeStyle: 'short',
  };
  if (calendar === 'JALALI') {
    options.calendar = 'persian';
  }
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return date.toISOString();
  }
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
