import {
  Component,
  computed,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {
  DEFAULT_BOUNDS_TIME_ZONE,
  civilDateTimeToUtc,
  daysInMonth,
  getZonedParts,
  instantToCivilDate,
  type CalendarSystem,
} from '@finance/shared';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { AuthService } from '../../core/auth.service';
import { CalendarPreferenceService } from '../../core/calendar-preference.service';
import { LocaleService } from '../../core/i18n/locale.service';
import { formatAppDateTime } from '../../core/format-app-date';

@Component({
  selector: 'app-date-time-field',
  standalone: true,
  imports: [
    FormsModule,
    ButtonDirective,
    DatePicker,
    InputText,
    TranslocoDirective,
  ],
  templateUrl: './app-date-time-field.component.html',
  styleUrl: './app-date-time-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppDateTimeFieldComponent),
      multi: true,
    },
  ],
})
export class AppDateTimeFieldComponent implements ControlValueAccessor {
  private readonly calendarPref = inject(CalendarPreferenceService);
  private readonly auth = inject(AuthService);
  private readonly locale = inject(LocaleService);

  readonly calendar = this.calendarPref.calendar;
  readonly open = signal(false);
  readonly gregorianDate = signal<Date | null>(null);

  readonly viewYear = signal(1404);
  readonly viewMonth = signal(1);
  readonly selectedDay = signal(1);
  readonly hour = signal(12);
  readonly minute = signal(0);

  readonly dayCells = computed(() => {
    const cal = this.calendar();
    const y = this.viewYear();
    const m = this.viewMonth();
    const len = daysInMonth(y, m, cal);
    return Array.from({ length: len }, (_, i) => i + 1);
  });

  readonly monthLabel = computed(() => {
    const cal = this.calendar();
    const mid = civilDateTimeToUtc(
      { year: this.viewYear(), month: this.viewMonth(), day: 15 },
      12,
      0,
      0,
      cal,
      'UTC',
    );
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    };
    if (cal === 'JALALI') {
      options.calendar = 'persian';
    }
    return new Intl.DateTimeFormat(this.locale.activeLang(), options).format(
      mid,
    );
  });

  readonly displayLabel = computed(() => {
    const iso = this.isoValue();
    if (!iso) {
      return '';
    }
    return formatAppDateTime(
      iso,
      this.calendar(),
      this.timeZone(),
      this.locale.activeLang(),
    );
  });

  private readonly isoValue = signal<string>('');
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  disabled = false;

  private timeZone(): string {
    return this.auth.user()?.timeZone?.trim() || DEFAULT_BOUNDS_TIME_ZONE;
  }

  writeValue(value: string | null): void {
    const iso = value ?? '';
    this.isoValue.set(iso);
    if (iso) {
      this.syncFromIso(iso);
    } else {
      this.syncFromIso(new Date().toISOString());
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleOpen(): void {
    if (this.disabled) {
      return;
    }
    this.open.update((v) => !v);
    this.onTouched();
  }

  onGregorianChange(date: Date | null): void {
    this.gregorianDate.set(date);
    if (!date) {
      return;
    }
    // Interpret picker wall-clock as profile timezone, not browser TZ alone.
    const iso = civilDateTimeToUtc(
      {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      },
      date.getHours(),
      date.getMinutes(),
      0,
      'GREGORIAN',
      this.timeZone(),
    ).toISOString();
    this.isoValue.set(iso);
    this.onChange(iso);
  }

  selectDay(day: number): void {
    this.selectedDay.set(day);
    this.emitJalali();
  }

  prevMonth(): void {
    const m = this.viewMonth();
    if (m === 1) {
      this.viewYear.update((y) => y - 1);
      this.viewMonth.set(12);
    } else {
      this.viewMonth.set(m - 1);
    }
  }

  nextMonth(): void {
    const m = this.viewMonth();
    if (m === 12) {
      this.viewYear.update((y) => y + 1);
      this.viewMonth.set(1);
    } else {
      this.viewMonth.set(m + 1);
    }
  }

  onHourChange(value: string): void {
    const n = Math.min(23, Math.max(0, Number(value) || 0));
    this.hour.set(n);
    this.emitJalali();
  }

  onMinuteChange(value: string): void {
    const n = Math.min(59, Math.max(0, Number(value) || 0));
    this.minute.set(n);
    this.emitJalali();
  }

  private emitJalali(): void {
    const cal: CalendarSystem = this.calendar();
    const date = civilDateTimeToUtc(
      {
        year: this.viewYear(),
        month: this.viewMonth(),
        day: this.selectedDay(),
      },
      this.hour(),
      this.minute(),
      0,
      cal,
      this.timeZone(),
    );
    const iso = date.toISOString();
    this.isoValue.set(iso);
    this.onChange(iso);
  }

  private syncFromIso(iso: string): void {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return;
    }
    const cal = this.calendar();
    const tz = this.timeZone();
    const parts = getZonedParts(date, tz);
    // DatePicker edits in "local Date" fields that we treat as profile TZ wall clock.
    this.gregorianDate.set(
      new Date(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        0,
      ),
    );
    const civil = instantToCivilDate(date, cal, tz);
    this.viewYear.set(civil.year);
    this.viewMonth.set(civil.month);
    this.selectedDay.set(civil.day);
    this.hour.set(parts.hour);
    this.minute.set(parts.minute);
  }
}
