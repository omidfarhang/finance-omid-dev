import { Pipe, PipeTransform, inject } from '@angular/core';
import { DEFAULT_BOUNDS_TIME_ZONE } from '@finance/shared';
import { AuthService } from './auth.service';
import { CalendarPreferenceService } from './calendar-preference.service';
import { LocaleService } from './i18n/locale.service';
import { formatAppDateTime } from './format-app-date';

@Pipe({
  name: 'appDateTime',
  standalone: true,
  pure: false,
})
export class AppDateTimePipe implements PipeTransform {
  private readonly calendarPref = inject(CalendarPreferenceService);
  private readonly auth = inject(AuthService);
  private readonly locale = inject(LocaleService);

  transform(value: string | Date | null | undefined): string {
    return formatAppDateTime(
      value,
      this.calendarPref.calendar(),
      this.auth.user()?.timeZone ?? DEFAULT_BOUNDS_TIME_ZONE,
      this.locale.activeLang(),
    );
  }
}
