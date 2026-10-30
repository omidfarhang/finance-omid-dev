import { Injectable, signal } from '@angular/core';
import { DEFAULT_CALENDAR, type CalendarSystem, type PublicUser } from '@finance/shared';

/** localStorage key for calendar preference cache. */
export const CALENDAR_STORAGE_KEY = 'finance.calendar';

function isCalendarSystem(value: string | null | undefined): value is CalendarSystem {
  return value === 'GREGORIAN' || value === 'JALALI';
}

@Injectable({ providedIn: 'root' })
export class CalendarPreferenceService {
  readonly calendar = signal<CalendarSystem>(this.readStored() ?? DEFAULT_CALENDAR);

  hydrateFromUser(user: PublicUser | null): void {
    if (!user || !isCalendarSystem(user.calendar)) {
      return;
    }
    this.setCalendar(user.calendar);
  }

  setCalendar(value: CalendarSystem): void {
    this.calendar.set(value);
    this.writeStored(value);
  }

  private readStored(): CalendarSystem | null {
    try {
      const value = localStorage.getItem(CALENDAR_STORAGE_KEY);
      return isCalendarSystem(value) ? value : null;
    } catch {
      return null;
    }
  }

  private writeStored(value: CalendarSystem): void {
    try {
      localStorage.setItem(CALENDAR_STORAGE_KEY, value);
    } catch {
      // Ignore quota / private-mode failures.
    }
  }
}
