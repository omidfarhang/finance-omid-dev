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

/**
 * Format civil wall-clock for the Jalali typed input: `yyyy/MM/dd HH:mm`.
 */
export function formatJalaliInput(
  iso: string | Date | null | undefined,
  timeZone: string | null | undefined,
): string {
  if (iso == null || iso === '') {
    return '';
  }
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const civil = instantToCivilDate(date, 'JALALI', timeZone);
  const parts = getZonedParts(date, timeZone);
  return `${civil.year}/${pad2(civil.month)}/${pad2(civil.day)} ${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

/**
 * Parse `yyyy/MM/dd HH:mm` (optional seconds ignored). Accepts `-` or `/` separators
 * and Persian digits. Returns null when invalid.
 */
export function parseJalaliInput(
  raw: string,
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
  const maxDay = daysInMonth(year, month, 'JALALI');
  if (day > maxDay) {
    return null;
  }
  return { year, month, day, hour, minute };
}

/** Parse Jalali typed input and convert to ISO instant in the given timezone. */
export function jalaliInputToIso(
  raw: string,
  timeZone: string | null | undefined,
): string | null {
  const parsed = parseJalaliInput(raw);
  if (!parsed) {
    return null;
  }
  return civilDateTimeToUtc(
    { year: parsed.year, month: parsed.month, day: parsed.day },
    parsed.hour,
    parsed.minute,
    0,
    'JALALI' satisfies CalendarSystem,
    timeZone,
  ).toISOString();
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
