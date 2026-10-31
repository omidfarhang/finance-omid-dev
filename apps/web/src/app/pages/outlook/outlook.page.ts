import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  NextMonthForecast,
  PublicRecurring,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { forkJoin } from 'rxjs';
import { formatCalendarMonthLabel } from '../../core/format-app-date';
import { LocaleService } from '../../core/i18n/locale.service';
import { formatBalanceMinor, minorUnitLabel } from '../../core/money-display';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { RecurringsService } from '../../core/recurrings.service';
import { AppAmountInputComponent } from '../../shared/app-amount-input/app-amount-input.component';

const CURRENCIES = ['IRR', 'USD'] as const;

@Component({
  selector: 'app-outlook-page',
  standalone: true,
  imports: [
    AppAmountInputComponent,
    FormsModule,
    ButtonDirective,
    Checkbox,
    Dialog,
    InputText,
    Message,
    Select,
    TranslocoDirective,
  ],
  templateUrl: './outlook.page.html',
  styleUrl: './outlook.page.scss',
})
export class OutlookPage implements OnInit {
  forecast = signal<NextMonthForecast | null>(null);
  rules = signal<PublicRecurring[]>([]);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  dialogVisible = signal(false);
  editingId: string | null = null;

  type: 'INCOME' | 'EXPENSE' = 'EXPENSE';
  amount = '';
  currency: (typeof CURRENCIES)[number] = 'IRR';
  description = '';
  anchorDay = 1;
  active = true;

  readonly currencies = CURRENCIES.map((code) => ({ label: code, value: code }));
  readonly typeOptions = computed(() => [
    { label: this.i18n.translate('activity.type.INCOME'), value: 'INCOME' },
    { label: this.i18n.translate('activity.type.EXPENSE'), value: 'EXPENSE' },
  ]);

  private readonly api = inject(RecurringsService);
  private readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly locale = inject(LocaleService);
  private readonly i18n = inject(TranslocoService);

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      forecast: this.api.nextMonthForecast(),
      rules: this.api.list(),
    }).subscribe({
      next: ({ forecast, rules }) => {
        this.forecast.set(forecast);
        this.rules.set(rules);
        this.loading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(
          err.error?.message ?? this.i18n.translate('outlook.loadFailed'),
        );
      },
    });
  }

  openCreate() {
    this.editingId = null;
    this.type = 'EXPENSE';
    this.amount = '';
    this.currency = 'IRR';
    this.description = '';
    this.anchorDay = 1;
    this.active = true;
    this.dialogVisible.set(true);
  }

  openEdit(rule: PublicRecurring) {
    this.editingId = rule.id;
    this.type = rule.type;
    this.amount = rule.amountMinor;
    this.currency = rule.currency as (typeof CURRENCIES)[number];
    this.description = rule.description ?? '';
    this.anchorDay = rule.anchorDay;
    this.active = rule.active;
    this.dialogVisible.set(true);
  }

  save() {
    this.error.set(null);
    this.message.set(null);
    if (!/^\d+$/.test(this.amount.trim()) || this.anchorDay < 1 || this.anchorDay > 28) {
      this.error.set(this.i18n.translate('outlook.invalidForm'));
      return;
    }
    const payload = {
      type: this.type,
      amountMinor: this.amount.trim(),
      currency: this.currency,
      description: this.description.trim() || null,
      interval: 'MONTHLY' as const,
      anchorDay: Number(this.anchorDay),
      active: this.active,
    };
    const req = this.editingId
      ? this.api.update(this.editingId, payload)
      : this.api.create(payload);
    req.subscribe({
      next: () => {
        this.message.set(this.i18n.translate('outlook.saved'));
        this.dialogVisible.set(false);
        this.reload();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('outlook.saveFailed'),
        );
      },
    });
  }

  remove(rule: PublicRecurring) {
    this.api.remove(rule.id).subscribe({
      next: () => {
        this.message.set(this.i18n.translate('outlook.deleted'));
        this.reload();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('outlook.deleteFailed'),
        );
      },
    });
  }

  forecastMonthLabel(forecast: NextMonthForecast): string {
    return formatCalendarMonthLabel(
      forecast.year,
      forecast.month,
      forecast.calendar,
      this.locale.activeLang(),
    );
  }

  formatMoney(amountMinor: string, currency: string): string {
    return formatBalanceMinor(
      amountMinor,
      currency,
      this.moneyDisplay.showToman(),
      {
        toman: this.i18n.translate('accounts.toman'),
        rials: this.i18n.translate('accounts.rials'),
        cents: this.i18n.translate('accounts.cents'),
      },
    );
  }

  unitLabel(currency: string): string {
    return minorUnitLabel(currency, {
      rials: this.i18n.translate('accounts.rials'),
      cents: this.i18n.translate('accounts.cents'),
    });
  }

  typeLabel(type: PublicRecurring['type']): string {
    return this.i18n.translate(`activity.type.${type}`);
  }
}
