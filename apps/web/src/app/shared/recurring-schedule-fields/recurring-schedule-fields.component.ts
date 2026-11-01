import { Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { MonthAnchor, RecurringInterval } from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Select } from 'primeng/select';

@Component({
  selector: 'app-recurring-schedule-fields',
  standalone: true,
  imports: [FormsModule, Select, TranslocoDirective],
  templateUrl: './recurring-schedule-fields.component.html',
  styleUrl: './recurring-schedule-fields.component.scss',
})
export class RecurringScheduleFieldsComponent {
  readonly interval = model.required<RecurringInterval>();
  readonly monthAnchor = model.required<MonthAnchor>();
  readonly anchorDay = model.required<number>();
  readonly anchorMonth = model.required<number>();
  readonly weekday = model.required<number>();
  /** Optional name prefix so multiple forms can coexist. */
  readonly namePrefix = input('schedule');

  private readonly i18n = inject(TranslocoService);

  readonly intervalOptions = computed(() => [
    { label: this.i18n.translate('outlook.interval.DAILY'), value: 'DAILY' },
    { label: this.i18n.translate('outlook.interval.WEEKLY'), value: 'WEEKLY' },
    {
      label: this.i18n.translate('outlook.interval.MONTHLY'),
      value: 'MONTHLY',
    },
    { label: this.i18n.translate('outlook.interval.YEARLY'), value: 'YEARLY' },
  ]);

  readonly monthAnchorOptions = computed(() => [
    {
      label: this.i18n.translate('outlook.monthAnchor.FIRST'),
      value: 'FIRST',
    },
    { label: this.i18n.translate('outlook.monthAnchor.LAST'), value: 'LAST' },
    { label: this.i18n.translate('outlook.monthAnchor.DAY'), value: 'DAY' },
  ]);

  readonly weekdayOptions = computed(() =>
    [0, 1, 2, 3, 4, 5, 6].map((value) => ({
      label: this.i18n.translate(`outlook.weekday.${value}`),
      value,
    })),
  );

  readonly dayOptions = computed(() =>
    Array.from({ length: 28 }, (_, i) => ({
      label: String(i + 1),
      value: i + 1,
    })),
  );

  readonly monthOptions = computed(() =>
    Array.from({ length: 12 }, (_, i) => ({
      label: this.i18n.translate(`outlook.month.${i + 1}`),
      value: i + 1,
    })),
  );

  onIntervalChange(value: RecurringInterval) {
    this.interval.set(value);
    if (value === 'WEEKLY' && (this.weekday() < 0 || this.weekday() > 6)) {
      this.weekday.set(0);
    }
    if (
      (value === 'MONTHLY' || value === 'YEARLY') &&
      this.monthAnchor() === 'DAY' &&
      (this.anchorDay() < 1 || this.anchorDay() > 28)
    ) {
      this.anchorDay.set(1);
    }
    if (value === 'YEARLY' && (this.anchorMonth() < 1 || this.anchorMonth() > 12)) {
      this.anchorMonth.set(1);
    }
  }
}
