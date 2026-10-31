import {
  calendarInputToIso,
  formatCalendarInput,
  formatJalaliInput,
  formatRelativeDayLabel,
  formatTimeInput,
  jalaliInputToIso,
  normalizeDigits,
  parseCalendarInput,
  parseJalaliInput,
  parseTimeInput,
} from './parse-app-date';

describe('normalizeDigits', () => {
  it('maps Persian and Arabic-Indic digits to ASCII', () => {
    expect(normalizeDigits('۱۴۰۴/۰۷/۱۵ ۱۴:۳۰')).toBe('1404/07/15 14:30');
    expect(normalizeDigits('١٤٠٤')).toBe('1404');
  });
});

describe('parseJalaliInput', () => {
  it('parses Latin yyyy/MM/dd HH:mm', () => {
    expect(parseJalaliInput('1404/07/15 14:30')).toEqual({
      year: 1404,
      month: 7,
      day: 15,
      hour: 14,
      minute: 30,
    });
  });

  it('parses Persian digits and dash separators', () => {
    expect(parseJalaliInput('۱۴۰۴-۷-۵ ۹:۵')).toEqual({
      year: 1404,
      month: 7,
      day: 5,
      hour: 9,
      minute: 5,
    });
  });

  it('defaults time to midnight when omitted', () => {
    expect(parseJalaliInput('1403/12/29')).toEqual({
      year: 1403,
      month: 12,
      day: 29,
      hour: 0,
      minute: 0,
    });
  });

  it('rejects invalid month/day/time and bad shape', () => {
    expect(parseJalaliInput('')).toBeNull();
    expect(parseJalaliInput('not-a-date')).toBeNull();
    expect(parseJalaliInput('1404/13/01 00:00')).toBeNull();
    expect(parseJalaliInput('1404/07/32 00:00')).toBeNull();
    expect(parseJalaliInput('1404/07/15 24:00')).toBeNull();
    expect(parseJalaliInput('1404/07/15 12:60')).toBeNull();
  });

  it('rejects days past Jalali month length', () => {
    // Esfand never has 31 days
    expect(parseJalaliInput('1403/12/31')).toBeNull();
  });
});

describe('parseCalendarInput (Gregorian)', () => {
  it('parses Gregorian wall clock', () => {
    expect(parseCalendarInput('2026/10/31 14:30', 'GREGORIAN')).toEqual({
      year: 2026,
      month: 10,
      day: 31,
      hour: 14,
      minute: 30,
    });
  });

  it('rejects Feb 30 Gregorian', () => {
    expect(parseCalendarInput('2026/02/30', 'GREGORIAN')).toBeNull();
  });
});

describe('jalaliInputToIso / formatJalaliInput', () => {
  it('round-trips through UTC timezone', () => {
    const iso = jalaliInputToIso('1404/01/01 00:00', 'UTC');
    expect(iso).toBeTruthy();
    expect(formatJalaliInput(iso!, 'UTC')).toBe('1404/01/01 00:00');
  });
});

describe('calendarInputToIso / formatCalendarInput', () => {
  it('round-trips Gregorian through UTC', () => {
    const iso = calendarInputToIso('2026/10/31 12:00', 'GREGORIAN', 'UTC');
    expect(iso).toBeTruthy();
    expect(formatCalendarInput(iso!, 'GREGORIAN', 'UTC')).toBe(
      '2026/10/31 12:00',
    );
  });
});

describe('parseTimeInput / formatTimeInput', () => {
  it('parses and formats HH:mm', () => {
    expect(parseTimeInput('9:05')).toEqual({ hour: 9, minute: 5 });
    expect(parseTimeInput('۲۳:۵۹')).toEqual({ hour: 23, minute: 59 });
    expect(formatTimeInput(9, 5)).toBe('09:05');
  });

  it('rejects invalid times', () => {
    expect(parseTimeInput('24:00')).toBeNull();
    expect(parseTimeInput('12')).toBeNull();
    expect(parseTimeInput('12:60')).toBeNull();
  });
});

describe('formatRelativeDayLabel', () => {
  const now = new Date('2026-10-31T15:00:00.000Z');

  it('labels today / yesterday / tomorrow in Gregorian UTC', () => {
    expect(
      formatRelativeDayLabel(
        '2026-10-31T08:00:00.000Z',
        'GREGORIAN',
        'UTC',
        now,
      ),
    ).toEqual({ kind: 'today', shortDate: '10/31' });
    expect(
      formatRelativeDayLabel(
        '2026-10-30T08:00:00.000Z',
        'GREGORIAN',
        'UTC',
        now,
      ),
    ).toEqual({ kind: 'yesterday', shortDate: '10/30' });
    expect(
      formatRelativeDayLabel(
        '2026-11-01T08:00:00.000Z',
        'GREGORIAN',
        'UTC',
        now,
      ),
    ).toEqual({ kind: 'tomorrow', shortDate: '11/1' });
  });

  it('uses year in shortDate when year differs', () => {
    expect(
      formatRelativeDayLabel(
        '2025-10-31T08:00:00.000Z',
        'GREGORIAN',
        'UTC',
        now,
      ),
    ).toEqual({ kind: 'other', shortDate: '2025/10/31' });
  });
});
