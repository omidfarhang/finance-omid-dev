import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  CreateRecurringDto,
  MonthAnchor,
  NextMonthForecast,
  PublicAccount,
  PublicCategory,
  PublicRecurring,
  RecurringInterval,
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
import {
  categoryColorCssVar,
  categoryLabel,
  categoryOptionFrom,
} from '../../core/category-display';
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
import { TransactionsService } from '../../core/transactions.service';
import { WalletsService } from '../../core/wallets.service';
import { AppAmountInputComponent } from '../../shared/app-amount-input/app-amount-input.component';
import { RecurringScheduleFieldsComponent } from '../../shared/recurring-schedule-fields/recurring-schedule-fields.component';

type RecurringTypeOption = {
  label: string;
  value: PublicRecurring['type'];
  icon: string;
};

@Component({
  selector: 'app-outlook-page',
  standalone: true,
  imports: [
    AppAmountInputComponent,
    RecurringScheduleFieldsComponent,
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
  accounts = signal<PublicAccount[]>([]);
  categories = signal<PublicCategory[]>([]);
  loading = signal(true);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  dialogVisible = signal(false);
  editingId: string | null = null;

  type: PublicRecurring['type'] = 'EXPENSE';
  amount = '';
  currency: UiCurrency = 'IRR';
  categoryId: string | null = null;
  description = '';
  interval: RecurringInterval = 'MONTHLY';
  monthAnchor: MonthAnchor = 'DAY';
  anchorDay = 1;
  anchorMonth = 1;
  weekday = 0;
  fromAccountId = '';
  toAccountId = '';
  active = true;

  readonly skeletonForecast = [0, 1];
  readonly skeletonRules = [0, 1, 2];

  private readonly api = inject(RecurringsService);
  private readonly walletsApi = inject(WalletsService);
  private readonly txApi = inject(TransactionsService);
  private readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly locale = inject(LocaleService);
  private readonly i18n = inject(TranslocoService);
  private readonly confirm = inject(ConfirmationService);

  readonly currencies = computed(() =>
    currencyOptions(this.locale.activeLang()),
  );
  readonly typeOptions = computed((): RecurringTypeOption[] => [
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
    {
      label: this.i18n.translate('activity.type.TRANSFER'),
      value: 'TRANSFER',
      icon: 'pi pi-arrows-h',
    },
  ]);

  readonly accountOptions = computed(() =>
    this.accounts().map((a) => ({
      label: `${a.name} (${this.currencyName(a.currency)})`,
      value: a.id,
    })),
  );

  readonly categoryOptions = computed(() => {
    const kind =
      this.type === 'INCOME'
        ? 'INCOME'
        : this.type === 'EXPENSE'
          ? 'EXPENSE'
          : 'TRANSFER';
    return [
      { label: this.i18n.translate('outlook.noCategory'), value: null as string | null },
      ...this.categories()
        .filter((c) => c.kind === kind)
        .map((c) => categoryOptionFrom(c, this.i18n)),
    ];
  });

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      forecast: this.api.nextMonthForecast(),
      rules: this.api.list(),
      accounts: this.walletsApi.listAccounts(),
      categories: this.txApi.listCategories(),
    }).subscribe({
      next: ({ forecast, rules, accounts, categories }) => {
        this.forecast.set(forecast);
        this.rules.set(rules);
        this.accounts.set(accounts);
        this.categories.set(categories);
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
    this.categoryId = null;
    this.description = '';
    this.interval = 'MONTHLY';
    this.monthAnchor = 'DAY';
    this.anchorDay = 1;
    this.anchorMonth = 1;
    this.weekday = 0;
    const accounts = this.accounts();
    this.fromAccountId = accounts[0]?.id ?? '';
    this.toAccountId = accounts[1]?.id ?? accounts[0]?.id ?? '';
    this.active = true;
    this.error.set(null);
    this.dialogVisible.set(true);
  }

  openEdit(rule: PublicRecurring) {
    this.editingId = rule.id;
    this.type = rule.type;
    this.amount = rule.amountMinor;
    this.currency = rule.currency as UiCurrency;
    this.categoryId = rule.categoryId;
    this.description = rule.description ?? '';
    this.interval = rule.interval;
    this.monthAnchor = rule.monthAnchor;
    this.anchorDay = rule.anchorDay ?? 1;
    this.anchorMonth = rule.anchorMonth ?? 1;
    this.weekday = rule.weekday ?? 0;
    this.fromAccountId = rule.fromAccountId ?? '';
    this.toAccountId = rule.toAccountId ?? '';
    this.active = rule.active;
    this.error.set(null);
    this.dialogVisible.set(true);
  }

  onTypeChange(type: PublicRecurring['type']) {
    this.type = type;
    this.categoryId = null;
  }

  onRowClick(rule: PublicRecurring, event: Event) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.row-actions')) {
      return;
    }
    this.openEdit(rule);
  }

  save() {
    this.error.set(null);
    this.message.set(null);
    if (!/^\d+$/.test(this.amount.trim())) {
      this.error.set(this.i18n.translate('outlook.invalidForm'));
      return;
    }

    let currency = this.currency;
    if (this.type === 'TRANSFER') {
      const from = this.accounts().find((a) => a.id === this.fromAccountId);
      if (!from || !this.toAccountId) {
        this.error.set(this.i18n.translate('outlook.invalidForm'));
        return;
      }
      currency = from.currency as UiCurrency;
    }

    const payload: CreateRecurringDto = {
      type: this.type,
      amountMinor: this.amount.trim(),
      currency,
      categoryId: this.categoryId,
      description: this.description.trim() || null,
      interval: this.interval,
      monthAnchor: this.monthAnchor,
      anchorDay:
        (this.interval === 'MONTHLY' || this.interval === 'YEARLY') &&
        this.monthAnchor === 'DAY'
          ? this.anchorDay
          : null,
      anchorMonth: this.interval === 'YEARLY' ? this.anchorMonth : null,
      weekday: this.interval === 'WEEKLY' ? this.weekday : null,
      fromAccountId: this.type === 'TRANSFER' ? this.fromAccountId : null,
      toAccountId: this.type === 'TRANSFER' ? this.toAccountId : null,
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

  confirmRemove(rule: PublicRecurring, event?: Event) {
    event?.stopPropagation();
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

  scheduleSummary(rule: PublicRecurring): string {
    const interval = this.i18n.translate(`outlook.interval.${rule.interval}`);
    if (rule.interval === 'DAILY') {
      return interval;
    }
    if (rule.interval === 'WEEKLY') {
      const day = this.i18n.translate(`outlook.weekday.${rule.weekday ?? 0}`);
      return `${interval} · ${day}`;
    }
    const anchor =
      rule.monthAnchor === 'FIRST'
        ? this.i18n.translate('outlook.monthAnchor.FIRST')
        : rule.monthAnchor === 'LAST'
          ? this.i18n.translate('outlook.monthAnchor.LAST')
          : this.i18n.translate('outlook.dayOfMonth', {
              day: rule.anchorDay ?? 1,
            });
    if (rule.interval === 'YEARLY') {
      const month = this.i18n.translate(
        `outlook.month.${rule.anchorMonth ?? 1}`,
      );
      return `${interval} · ${month} · ${anchor}`;
    }
    return `${interval} · ${anchor}`;
  }

  categoryChip(rule: PublicRecurring): PublicCategory | null {
    if (!rule.categoryId) {
      return null;
    }
    return this.categories().find((c) => c.id === rule.categoryId) ?? null;
  }

  categoryName(category: PublicCategory): string {
    return categoryLabel(category, this.i18n);
  }

  colorVar(color: string | null | undefined): string | null {
    return categoryColorCssVar(color);
  }

  accountName(id: string | null): string {
    if (!id) {
      return '';
    }
    return this.accounts().find((a) => a.id === id)?.name ?? id.slice(0, 8);
  }

  transferMeta(rule: PublicRecurring): string {
    if (rule.type !== 'TRANSFER') {
      return '';
    }
    return `${this.accountName(rule.fromAccountId)} → ${this.accountName(rule.toAccountId)}`;
  }

  dialogCurrency(): string {
    if (this.type === 'TRANSFER') {
      return (
        this.accounts().find((a) => a.id === this.fromAccountId)?.currency ??
        'IRR'
      );
    }
    return this.currency;
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
