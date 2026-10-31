import {
  civilDateTimeToUtc,
  daysInMonth,
  getZonedParts,
  instantToCivilDate,
  type CalendarSystem,
  type CivilDate,
} from '@finance/shared';

const PERSIAN_DIGIT_MAP: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

/** Normalize Persian/Arabic-Indic digits to ASCII. */
export function normalizeDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (ch) => PERSIAN_DIGIT_MAP[ch] ?? ch);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export type ParsedCivilDateTime = CivilDate & {
  hour: number;
  minute: number;
};

export type RelativeDayKind =
  | 'today'
  | 'yesterday'
  | 'tomorrow'
  | 'daysAgo'
  | 'inDays'
  | 'other';

/** Inclusive window for relative day captions beyond yesterday/tomorrow. */
export const RELATIVE_DAY_WINDOW = 7;

export type RelativeDayLabel = {
  kind: RelativeDayKind;
  /** Full civil date: `yyyy/MM/dd`. */
  shortDate: string;
  /** Absolute day count for `daysAgo` / `inDays` (2–7). */
  count?: number;
};

/**
 * Format civil wall-clock for the typed input: `yyyy/MM/dd HH:mm`
 * in the given calendar + timezone.
 */
export function formatCalendarInput(
  iso: string | Date | null | undefined,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
): string {
  if (iso == null || iso === '') {
    return '';
  }
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const civil = instantToCivilDate(date, calendar, timeZone);
  const parts = getZonedParts(date, timeZone);
  return `${civil.year}/${pad2(civil.month)}/${pad2(civil.day)} ${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

/** @deprecated Prefer formatCalendarInput(..., 'JALALI', tz). */
export function formatJalaliInput(
  iso: string | Date | null | undefined,
  timeZone: string | null | undefined,
): string {
  return formatCalendarInput(iso, 'JALALI', timeZone);
}

/**
 * Parse `yyyy/MM/dd HH:mm` (optional seconds ignored). Accepts `-` or `/` separators
 * and Persian digits. Validates against the given calendar's month lengths.
 */
export function parseCalendarInput(
  raw: string,
  calendar: CalendarSystem,
): ParsedCivilDateTime | null {
  const normalized = normalizeDigits(raw.trim()).replace(/\s+/g, ' ');
  if (!normalized) {
    return null;
  }
  const match = normalized.match(
    /^(\d{3,4})[/-](\d{1,2})[/-](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::\d{1,2})?)?$/,
  );
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] != null ? Number(match[4]) : 0;
  const minute = match[5] != null ? Number(match[5]) : 0;
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  const maxDay = daysInMonth(year, month, calendar);
  if (day > maxDay) {
    return null;
  }
  return { year, month, day, hour, minute };
}

/** @deprecated Prefer parseCalendarInput(..., 'JALALI'). */
export function parseJalaliInput(raw: string): ParsedCivilDateTime | null {
  return parseCalendarInput(raw, 'JALALI');
}

/** Parse typed civil input and convert to ISO instant in the given timezone. */
export function calendarInputToIso(
  raw: string,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
): string | null {
  const parsed = parseCalendarInput(raw, calendar);
  if (!parsed) {
    return null;
  }
  return civilDateTimeToUtc(
    { year: parsed.year, month: parsed.month, day: parsed.day },
    parsed.hour,
    parsed.minute,
    0,
    calendar,
    timeZone,
  ).toISOString();
}

/** @deprecated Prefer calendarInputToIso(..., 'JALALI', tz). */
export function jalaliInputToIso(
  raw: string,
  timeZone: string | null | undefined,
): string | null {
  return calendarInputToIso(raw, 'JALALI', timeZone);
}

/**
 * Parse `HH:mm` (Persian digits ok). Returns null when invalid.
 */
export function parseTimeInput(raw: string): { hour: number; minute: number } | null {
  const normalized = normalizeDigits(raw.trim());
  const match = normalized.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { hour, minute };
}

export function formatTimeInput(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

function formatDisplayCivilDate(civil: CivilDate): string {
  return `${civil.year}/${pad2(civil.month)}/${pad2(civil.day)}`;
}

/** Signed civil-day offset of `civil` relative to `today` (0 = today). */
function civilDayOffset(
  civil: CivilDate,
  today: CivilDate,
  calendar: CalendarSystem,
): number {
  const a = civilDateTimeToUtc(civil, 12, 0, 0, calendar, 'UTC').getTime();
  const b = civilDateTimeToUtc(today, 12, 0, 0, calendar, 'UTC').getTime();
  return Math.round((a - b) / 86_400_000);
}

/**
 * Relative day kind + full civil date for the compact stepper label.
 * Covers today / yesterday / tomorrow and ±2…±7 as daysAgo / inDays.
 */
export function formatRelativeDayLabel(
  iso: string | Date,
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
  now: Date = new Date(),
): RelativeDayLabel {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) {
    return { kind: 'other', shortDate: '' };
  }
  const civil = instantToCivilDate(date, calendar, timeZone);
  const todayCivil = instantToCivilDate(now, calendar, timeZone);
  const shortDate = formatDisplayCivilDate(civil);
  const offset = civilDayOffset(civil, todayCivil, calendar);

  if (offset === 0) {
    return { kind: 'today', shortDate };
  }
  if (offset === -1) {
    return { kind: 'yesterday', shortDate };
  }
  if (offset === 1) {
    return { kind: 'tomorrow', shortDate };
  }
  if (offset >= -RELATIVE_DAY_WINDOW && offset <= -2) {
    return { kind: 'daysAgo', shortDate, count: -offset };
  }
  if (offset >= 2 && offset <= RELATIVE_DAY_WINDOW) {
    return { kind: 'inDays', shortDate, count: offset };
  }
  return { kind: 'other', shortDate };
}
