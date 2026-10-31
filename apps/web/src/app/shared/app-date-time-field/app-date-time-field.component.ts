import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {
  DEFAULT_BOUNDS_TIME_ZONE,
  addCivilDays,
  civilDateTimeToUtc,
  daysInMonth,
  firstDayOfWeek,
  getZonedParts,
  instantToCivilDate,
  monthGridStartOffset,
  type CalendarSystem,
  type CivilDate,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { AuthService } from '../../core/auth.service';
import { CalendarPreferenceService } from '../../core/calendar-preference.service';
import { LocaleService } from '../../core/i18n/locale.service';
import {
  calendarInputToIso,
  formatCalendarInput,
  formatRelativeDayLabel,
  formatTimeInput,
  parseTimeInput,
  type RelativeDayKind,
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

export type DayCell = {
  day: number | null;
  disabled: boolean;
};

@Component({
  selector: 'app-date-time-field',
  standalone: true,
  imports: [
    FormsModule,
    ButtonDirective,
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
  private readonly i18n = inject(TranslocoService);

  /** Inclusive lower bound (epoch ms). Null = no minimum. */
  readonly minUnix = input<number | null>(null);
  /** Inclusive upper bound (epoch ms). Null = no maximum. */
  readonly maxUnix = input<number | null>(null);

  readonly calendar = this.calendarPref.calendar;
  readonly open = signal(false);
  readonly editing = signal(false);
  readonly overlayPositions = OVERLAY_POSITIONS;
  private readonly dateInput =
    viewChild<ElementRef<HTMLInputElement>>('dateInput');

  readonly viewYear = signal(1404);
  readonly viewMonth = signal(1);
  readonly selectedDay = signal(1);
  readonly hour = signal(12);
  readonly minute = signal(0);

  /** Draft text in the typed input. */
  readonly typedText = signal('');
  /** Draft text for panel HH:mm. */
  readonly timeText = signal('12:00');

  readonly weekdayLabels = computed(() => {
    const cal = this.calendar();
    const first = firstDayOfWeek(cal);
    const lang = this.locale.activeLang();
    const labels: string[] = [];
    // Anchor: 2023-01-01 was Sunday → index 0
    for (let i = 0; i < 7; i++) {
      const dayIndex = (first + i) % 7;
      const anchor = new Date(Date.UTC(2023, 0, 1 + dayIndex, 12));
      labels.push(
        new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' }).format(
          anchor,
        ),
      );
    }
    return labels;
  });

  readonly dayCells = computed((): DayCell[] => {
    const cal = this.calendar();
    const y = this.viewYear();
    const m = this.viewMonth();
    const len = daysInMonth(y, m, cal);
    const offset = monthGridStartOffset(y, m, cal);
    const cells: DayCell[] = [];
    for (let i = 0; i < offset; i++) {
      cells.push({ day: null, disabled: true });
    }
    for (let day = 1; day <= len; day++) {
      cells.push({
        day,
        disabled: !this.isCivilDayAllowed(y, m, day),
      });
    }
    return cells;
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

  readonly relativeLabel = computed(() => {
    const iso = this.isoValue();
    if (!iso) {
      return { kind: 'other' as RelativeDayKind, shortDate: '' };
    }
    return formatRelativeDayLabel(
      iso,
      this.calendar(),
      this.timeZone(),
      new Date(),
    );
  });

  readonly stripCaption = computed(() => {
    const { kind, shortDate, count } = this.relativeLabel();
    if (!shortDate) {
      return '';
    }
    if (kind === 'other') {
      return shortDate;
    }
    const relative =
      kind === 'daysAgo' || kind === 'inDays'
        ? this.i18n.translate(`common.${kind}`, { count: count ?? 0 })
        : this.i18n.translate(`common.${kind}`);
    return `(${relative}, ${shortDate})`;
  });

  readonly canStepPrev = computed(() => this.canStep(-1));
  readonly canStepNext = computed(() => this.canStep(1));

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

  startEditing(): void {
    if (this.disabled) {
      return;
    }
    this.editing.set(true);
    this.refreshTypedFromIso();
    queueMicrotask(() => this.dateInput()?.nativeElement.focus());
  }

  onTypedTextInput(value: string): void {
    this.typedText.set(value);
  }

  commitTypedText(): void {
    this.onTouched();
    this.editing.set(false);
    const raw = this.typedText().trim();
    if (!raw) {
      this.refreshTypedFromIso();
      return;
    }
    const iso = calendarInputToIso(raw, this.calendar(), this.timeZone());
    if (!iso || !this.isInstantAllowed(new Date(iso).getTime())) {
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
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.editing.set(false);
      this.refreshTypedFromIso();
    }
  }

  stepDay(delta: number): void {
    if (this.disabled || !this.canStep(delta)) {
      return;
    }
    const cal = this.calendar();
    const next = addCivilDays(
      {
        year: this.viewYear(),
        month: this.viewMonth(),
        day: this.selectedDay(),
      },
      delta,
      cal,
    );
    this.viewYear.set(next.year);
    this.viewMonth.set(next.month);
    this.selectedDay.set(next.day);
    this.emitSelection();
    this.onTouched();
  }

  selectDay(day: number): void {
    const cell = this.dayCells().find((c) => c.day === day);
    if (!cell || cell.disabled) {
      return;
    }
    this.selectedDay.set(day);
    this.emitSelection();
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
    const trialMs = this.civilDaySampleMs(
      this.viewYear(),
      this.viewMonth(),
      this.selectedDay(),
      parsed.hour,
      parsed.minute,
    );
    if (!this.isInstantAllowed(trialMs)) {
      this.timeText.set(formatTimeInput(this.hour(), this.minute()));
      return;
    }
    this.hour.set(parsed.hour);
    this.minute.set(parsed.minute);
    this.timeText.set(formatTimeInput(parsed.hour, parsed.minute));
    this.emitSelection();
  }

  onTimeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitTimeText();
    }
  }

  isInstantAllowed(ms: number): boolean {
    if (Number.isNaN(ms)) {
      return false;
    }
    const min = this.minUnix();
    const max = this.maxUnix();
    if (min != null && ms < min) {
      return false;
    }
    if (max != null && ms > max) {
      return false;
    }
    return true;
  }

  /** True when any wall-clock on that civil day can fall inside min/max. */
  private isCivilDayAllowed(year: number, month: number, day: number): boolean {
    const dayStart = civilDateTimeToUtc(
      { year, month, day },
      0,
      0,
      0,
      this.calendar(),
      this.timeZone(),
    ).getTime();
    const dayEnd = civilDateTimeToUtc(
      { year, month, day },
      23,
      59,
      59,
      this.calendar(),
      this.timeZone(),
    ).getTime();
    const min = this.minUnix();
    const max = this.maxUnix();
    if (min != null && dayEnd < min) {
      return false;
    }
    if (max != null && dayStart > max) {
      return false;
    }
    return true;
  }

  private canStep(delta: number): boolean {
    const next = addCivilDays(
      {
        year: this.viewYear(),
        month: this.viewMonth(),
        day: this.selectedDay(),
      },
      delta,
      this.calendar(),
    );
    return this.isCivilDayAllowed(next.year, next.month, next.day);
  }

  private civilDaySampleMs(
    year: number,
    month: number,
    day: number,
    hour = this.hour(),
    minute = this.minute(),
  ): number {
    return civilDateTimeToUtc(
      { year, month, day },
      hour,
      minute,
      0,
      this.calendar(),
      this.timeZone(),
    ).getTime();
  }

  private clampSelectedDay(): void {
    const max = daysInMonth(this.viewYear(), this.viewMonth(), this.calendar());
    if (this.selectedDay() > max) {
      this.selectedDay.set(max);
      this.emitSelection();
    }
  }

  private emitSelection(): void {
    const cal: CalendarSystem = this.calendar();
    const civil = {
      year: this.viewYear(),
      month: this.viewMonth(),
      day: this.selectedDay(),
    };
    let hour = this.hour();
    let minute = this.minute();
    let date = civilDateTimeToUtc(
      civil,
      hour,
      minute,
      0,
      cal,
      this.timeZone(),
    );
    if (!this.isInstantAllowed(date.getTime())) {
      const clamped = this.clampInstantToBounds(civil);
      if (!clamped) {
        this.refreshTypedFromIso();
        return;
      }
      date = clamped;
      const parts = getZonedParts(date, this.timeZone());
      hour = parts.hour;
      minute = parts.minute;
      this.hour.set(hour);
      this.minute.set(minute);
    }
    const iso = date.toISOString();
    this.isoValue.set(iso);
    this.refreshTypedFromIso();
    this.onChange(iso);
  }

  /** Pick nearest in-bound wall clock on the given civil day, or null. */
  private clampInstantToBounds(civil: CivilDate): Date | null {
    if (!this.isCivilDayAllowed(civil.year, civil.month, civil.day)) {
      return null;
    }
    const min = this.minUnix();
    const max = this.maxUnix();
    const preferred = civilDateTimeToUtc(
      civil,
      this.hour(),
      this.minute(),
      0,
      this.calendar(),
      this.timeZone(),
    ).getTime();
    let target = preferred;
    if (min != null && target < min) {
      target = min;
    }
    if (max != null && target > max) {
      target = max;
    }
    const date = new Date(target);
    const parts = getZonedParts(date, this.timeZone());
    const landed = instantToCivilDate(date, this.calendar(), this.timeZone());
    if (
      landed.year !== civil.year ||
      landed.month !== civil.month ||
      landed.day !== civil.day
    ) {
      // Bound landed on a different civil day — use start or end of requested day.
      if (min != null && preferred < min) {
        return civilDateTimeToUtc(
          civil,
          23,
          59,
          0,
          this.calendar(),
          this.timeZone(),
        );
      }
      return civilDateTimeToUtc(
        civil,
        0,
        0,
        0,
        this.calendar(),
        this.timeZone(),
      );
    }
    return civilDateTimeToUtc(
      civil,
      parts.hour,
      parts.minute,
      0,
      this.calendar(),
      this.timeZone(),
    );
  }

  private refreshTypedFromIso(): void {
    const iso = this.isoValue();
    if (!iso) {
      this.typedText.set('');
      return;
    }
    this.typedText.set(
      formatCalendarInput(iso, this.calendar(), this.timeZone()),
    );
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
    const civil: CivilDate = instantToCivilDate(date, cal, tz);
    this.viewYear.set(civil.year);
    this.viewMonth.set(civil.month);
    this.selectedDay.set(civil.day);
    this.hour.set(parts.hour);
    this.minute.set(parts.minute);
    this.typedText.set(formatCalendarInput(iso, cal, tz));
    this.timeText.set(formatTimeInput(parts.hour, parts.minute));
  }
}
