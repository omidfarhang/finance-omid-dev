import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
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
import {
  formatJalaliInput,
  formatTimeInput,
  jalaliInputToIso,
  parseTimeInput,
} from '../../core/parse-app-date';

const OVERLAY_POSITIONS = [
  {
    originX: 'start' as const,
    originY: 'bottom' as const,
    overlayX: 'start' as const,
    overlayY: 'top' as const,
    offsetY: 4,
  },
  {
    originX: 'start' as const,
    originY: 'top' as const,
    overlayX: 'start' as const,
    overlayY: 'bottom' as const,
    offsetY: -4,
  },
  {
    originX: 'end' as const,
    originY: 'bottom' as const,
    overlayX: 'end' as const,
    overlayY: 'top' as const,
    offsetY: 4,
  },
];

@Component({
  selector: 'app-date-time-field',
  standalone: true,
  imports: [
    FormsModule,
    ButtonDirective,
    DatePicker,
    InputText,
    TranslocoDirective,
    CdkOverlayOrigin,
    CdkConnectedOverlay,
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
  readonly overlayPositions = OVERLAY_POSITIONS;

  readonly viewYear = signal(1404);
  readonly viewMonth = signal(1);
  readonly selectedDay = signal(1);
  readonly hour = signal(12);
  readonly minute = signal(0);

  /** Draft text in the Jalali typed input. */
  readonly typedText = signal('');
  /** Draft text for panel HH:mm. */
  readonly timeText = signal('12:00');

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
      this.typedText.set('');
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

  closePanel(): void {
    this.open.set(false);
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closePanel();
    }
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

  onTypedTextInput(value: string): void {
    this.typedText.set(value);
  }

  commitTypedText(): void {
    this.onTouched();
    const raw = this.typedText().trim();
    if (!raw) {
      this.refreshTypedFromIso();
      return;
    }
    const iso = jalaliInputToIso(raw, this.timeZone());
    if (!iso) {
      this.refreshTypedFromIso();
      return;
    }
    this.isoValue.set(iso);
    this.syncFromIso(iso);
    this.onChange(iso);
  }

  onTypedKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitTypedText();
    }
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
    this.clampSelectedDay();
  }

  nextMonth(): void {
    const m = this.viewMonth();
    if (m === 12) {
      this.viewYear.update((y) => y + 1);
      this.viewMonth.set(1);
    } else {
      this.viewMonth.set(m + 1);
    }
    this.clampSelectedDay();
  }

  prevYear(): void {
    this.viewYear.update((y) => y - 1);
    this.clampSelectedDay();
  }

  nextYear(): void {
    this.viewYear.update((y) => y + 1);
    this.clampSelectedDay();
  }

  onTimeTextInput(value: string): void {
    this.timeText.set(value);
  }

  commitTimeText(): void {
    const parsed = parseTimeInput(this.timeText());
    if (!parsed) {
      this.timeText.set(formatTimeInput(this.hour(), this.minute()));
      return;
    }
    this.hour.set(parsed.hour);
    this.minute.set(parsed.minute);
    this.timeText.set(formatTimeInput(parsed.hour, parsed.minute));
    this.emitJalali();
  }

  onTimeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitTimeText();
    }
  }

  private clampSelectedDay(): void {
    const max = daysInMonth(this.viewYear(), this.viewMonth(), this.calendar());
    if (this.selectedDay() > max) {
      this.selectedDay.set(max);
      this.emitJalali();
    }
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
    this.refreshTypedFromIso();
    this.onChange(iso);
  }

  private refreshTypedFromIso(): void {
    const iso = this.isoValue();
    if (!iso) {
      this.typedText.set('');
      return;
    }
    this.typedText.set(formatJalaliInput(iso, this.timeZone()));
    this.timeText.set(formatTimeInput(this.hour(), this.minute()));
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
    this.typedText.set(formatJalaliInput(iso, tz));
    this.timeText.set(formatTimeInput(parts.hour, parts.minute));
  }
}
