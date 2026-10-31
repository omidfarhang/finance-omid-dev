import {
  formatJalaliInput,
  formatTimeInput,
  jalaliInputToIso,
  normalizeDigits,
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

describe('jalaliInputToIso / formatJalaliInput', () => {
  it('round-trips through UTC timezone', () => {
    const iso = jalaliInputToIso('1404/01/01 00:00', 'UTC');
    expect(iso).toBeTruthy();
    expect(formatJalaliInput(iso!, 'UTC')).toBe('1404/01/01 00:00');
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
