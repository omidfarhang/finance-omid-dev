import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  NextMonthForecast,
  PublicRecurring,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { forkJoin } from 'rxjs';
import { formatCalendarMonthLabel } from '../../core/format-app-date';
import {
  currencyLabel,
  currencyOptions,
  type UiCurrency,
} from '../../core/currencies';
import { LocaleService } from '../../core/i18n/locale.service';
import { formatBalanceMinor, minorUnitLabel } from '../../core/money-display';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { RecurringsService } from '../../core/recurrings.service';
import { AppAmountInputComponent } from '../../shared/app-amount-input/app-amount-input.component';

type TypeOption = {
  label: string;
  value: 'INCOME' | 'EXPENSE';
  icon: string;
};

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
    SelectButton,
    Skeleton,
    TranslocoDirective,
  ],
  templateUrl: './outlook.page.html',
  styleUrl: './outlook.page.scss',
})
export class OutlookPage implements OnInit {
  forecast = signal<NextMonthForecast | null>(null);
  rules = signal<PublicRecurring[]>([]);
  loading = signal(true);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  dialogVisible = signal(false);
  editingId: string | null = null;

  type: 'INCOME' | 'EXPENSE' = 'EXPENSE';
  amount = '';
  currency: UiCurrency = 'IRR';
  description = '';
  anchorDay = 1;
  active = true;

  readonly skeletonForecast = [0, 1];
  readonly skeletonRules = [0, 1, 2];

  private readonly api = inject(RecurringsService);
  private readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly locale = inject(LocaleService);
  private readonly i18n = inject(TranslocoService);
  private readonly confirm = inject(ConfirmationService);

  readonly currencies = computed(() =>
    currencyOptions(this.locale.activeLang()),
  );
  readonly typeOptions = computed((): TypeOption[] => [
    {
      label: this.i18n.translate('activity.type.INCOME'),
      value: 'INCOME',
      icon: 'pi pi-arrow-down',
    },
    {
      label: this.i18n.translate('activity.type.EXPENSE'),
      value: 'EXPENSE',
      icon: 'pi pi-arrow-up',
    },
  ]);

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
    this.error.set(null);
    this.dialogVisible.set(true);
  }

  openEdit(rule: PublicRecurring) {
    this.editingId = rule.id;
    this.type = rule.type;
    this.amount = rule.amountMinor;
    this.currency = rule.currency as UiCurrency;
    this.description = rule.description ?? '';
    this.anchorDay = rule.anchorDay;
    this.active = rule.active;
    this.error.set(null);
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

  confirmRemove(rule: PublicRecurring) {
    const name =
      rule.description?.trim() ||
      `${this.typeLabel(rule.type)} · ${this.currencyName(rule.currency)}`;
    this.confirm.confirm({
      message: this.i18n.translate('outlook.confirmDelete', { name }),
      header: this.i18n.translate('outlook.delete'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.remove(rule),
    });
  }

  remove(rule: PublicRecurring) {
    this.error.set(null);
    this.message.set(null);
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

  isShortfall(surplusMinor: string): boolean {
    try {
      return BigInt(surplusMinor) < 0n;
    } catch {
      return surplusMinor.trim().startsWith('-');
    }
  }

  surplusLabel(surplusMinor: string): string {
    return this.i18n.translate(
      this.isShortfall(surplusMinor) ? 'outlook.shortfall' : 'outlook.surplus',
    );
  }

  currencyName(currency: string): string {
    return currencyLabel(currency, this.locale.activeLang());
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
      this.locale.activeLang(),
    );
  }

  unitLabel(currency: string): string {
    return minorUnitLabel(
      currency,
      {
        rials: this.i18n.translate('accounts.rials'),
        cents: this.i18n.translate('accounts.cents'),
      },
      this.locale.activeLang(),
    );
  }

  typeLabel(type: PublicRecurring['type']): string {
    return this.i18n.translate(`activity.type.${type}`);
  }
}
