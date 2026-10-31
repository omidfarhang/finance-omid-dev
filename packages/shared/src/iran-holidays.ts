import jalaali from 'jalaali-js';
import type { CalendarSystem, CivilDate } from './calendar';
import { weekdayIndex } from './calendar';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** `MM-DD` keys within a Jalali year (official Iran public holidays). */
type MonthDayKey = string;

/**
 * Official Iran holidays by Jalali year.
 * 1403–1405: University of Tehran calendar centre PDFs.
 * 1406: timestamp.ir official-holiday list (UT PDF not published yet); excludes
 * plain Fridays that are only weekends (already covered by {@link isWeekendDay}).
 * Years outside this map still get weekend coloring via {@link isWeekendDay}.
 */
const IRAN_HOLIDAYS_BY_JALALI_YEAR: Readonly<
  Record<number, ReadonlySet<MonthDayKey>>
> = {
  // https://calendar.ut.ac.ir/ … Holiday-1403.pdf
  1403: new Set([
    '01-01',
    '01-02',
    '01-03',
    '01-04',
    '01-12',
    '01-13',
    '01-22',
    '01-23',
    '02-15',
    '03-14',
    '03-15',
    '03-28',
    '04-05',
    '04-25',
    '04-26',
    '06-04',
    '06-12',
    '06-14',
    '06-22',
    '06-31',
    '09-15',
    '10-25',
    '11-09',
    '11-22',
    '11-26',
    '12-29',
  ]),
  // https://calendar.ut.ac.ir/ … Calendar-1404.pdf / Holiday-1404
  1404: new Set([
    '01-01',
    '01-02',
    '01-03',
    '01-04',
    '01-11',
    '01-12',
    '01-13',
    '02-04',
    '03-14',
    '03-15',
    '03-16',
    '03-24',
    '04-14',
    '04-15',
    '05-23',
    '05-31',
    '06-02',
    '06-10',
    '06-19',
    '09-03',
    '10-13',
    '10-27',
    '11-15',
    '11-22',
    '12-20',
    '12-29',
  ]),
  // https://calendar.ut.ac.ir/ … Calendar-1405.pdf
  1405: new Set([
    '01-01',
    '01-02',
    '01-03',
    '01-04',
    '01-12',
    '01-13',
    '01-25',
    '03-06',
    '03-14',
    '03-15',
    '04-03',
    '04-04',
    '05-13',
    '05-21',
    '05-22',
    '05-30',
    '06-08',
    '09-22',
    '11-02',
    '11-04',
    '11-16',
    '11-22',
    '12-09',
    '12-19',
    '12-20',
    '12-29',
  ]),
  // https://timestamp.ir/holidays-list/1406 (cross-checked against typical official set)
  1406: new Set([
    '01-01',
    '01-02',
    '01-03',
    '01-04',
    '01-12',
    '01-13',
    '01-14',
    '02-27',
    '03-04',
    '03-14',
    '03-15',
    '03-24',
    '03-25',
    '05-03',
    '05-11',
    '05-12',
    '05-20',
    '05-29',
    '08-12',
    '09-21',
    '10-05',
    '10-23',
    '11-22',
    '11-28',
    '12-08',
    '12-09',
    '12-29',
  ]),
};

function toJalaliCivil(
  civil: CivilDate,
  calendar: CalendarSystem,
): CivilDate {
  if (calendar === 'JALALI') {
    return civil;
  }
  const j = jalaali.toJalaali(civil.year, civil.month, civil.day);
  return { year: j.jy, month: j.jm, day: j.jd };
}

/** True for Iran official holidays when the Jalali year is in the dictionary. */
export function isIranOfficialHoliday(
  civil: CivilDate,
  calendar: CalendarSystem,
): boolean {
  const j = toJalaliCivil(civil, calendar);
  const yearSet = IRAN_HOLIDAYS_BY_JALALI_YEAR[j.year];
  if (!yearSet) {
    return false;
  }
  return yearSet.has(`${pad(j.month)}-${pad(j.day)}`);
}

/**
 * Weekend by calendar convention:
 * Jalali / Iran → Friday; Gregorian → Saturday + Sunday.
 */
export function isWeekendDay(
  civil: CivilDate,
  calendar: CalendarSystem,
): boolean {
  const wd = weekdayIndex(civil, calendar);
  if (calendar === 'JALALI') {
    return wd === 5; // Friday
  }
  return wd === 0 || wd === 6; // Sunday or Saturday
}

/** Weekend or Iran official holiday (for picker day-off coloring). */
export function isDayOff(
  civil: CivilDate,
  calendar: CalendarSystem,
): boolean {
  return isWeekendDay(civil, calendar) || isIranOfficialHoliday(civil, calendar);
}

/** Weekday indices (0=Sun…6=Sat) that are weekends for the calendar system. */
export function weekendWeekdayIndexes(
  calendar: CalendarSystem,
): readonly number[] {
  return calendar === 'JALALI' ? [5] : [0, 6];
}
