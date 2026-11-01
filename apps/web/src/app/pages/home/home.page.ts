import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type {
  ForecastCurrency,
  NextMonthForecast,
  PublicAccount,
  PublicCategory,
  PublicRecurring,
  PublicTransaction,
  PublicWallet,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { forkJoin } from 'rxjs';
import { AppDateTimePipe } from '../../core/app-date-time.pipe';
import {
  categoryColorCssVar,
  categoryLabel,
} from '../../core/category-display';
import { formatCalendarMonthLabel } from '../../core/format-app-date';
import { LocaleService } from '../../core/i18n/locale.service';
import { currencyLabel } from '../../core/currencies';
import { formatBalanceMinor } from '../../core/money-display';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { RecurringsService } from '../../core/recurrings.service';
import { TransactionsService } from '../../core/transactions.service';
import { WalletsService } from '../../core/wallets.service';
import {
  AddMovementDialogComponent,
  type AddMovementSavedEvent,
} from '../../shared/add-movement-dialog/add-movement-dialog.component';

const RECENT_LIMIT = 8;

type AccountRow = {
  account: PublicAccount;
  walletName: string;
};

type OutlookRow = ForecastCurrency & {
  shortfall: boolean;
  incomePct: number;
  expensePct: number;
  /** Expenses as a whole percent of income; null when income is zero. */
  expenseSharePct: number | null;
};

function toBigInt(minor: string): bigint {
  try {
    return BigInt(minor);
  } catch {
    return 0n;
  }
}

/** Whole percent of `part / whole` (0 when whole is 0), using integer math. */
function wholePercent(part: bigint, whole: bigint): number {
  if (whole <= 0n) {
    return 0;
  }
  return Number((part * 100n) / whole);
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    AddMovementDialogComponent,
    AppDateTimePipe,
    RouterLink,
    ButtonDirective,
    Message,
    Skeleton,
    TranslocoDirective,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  readonly skeletonBoxes = [0, 1, 2];
  readonly skeletonRows = [0, 1, 2, 3];
  readonly skeletonOutlook = [0, 1];

  wallets = signal<PublicWallet[]>([]);
  accounts = signal<PublicAccount[]>([]);
  categories = signal<PublicCategory[]>([]);
  recent = signal<PublicTransaction[]>([]);
  forecast = signal<NextMonthForecast | null>(null);
  recurrings = signal<PublicRecurring[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  message = signal<string | null>(null);
  addDialogVisible = signal(false);

  readonly accountRows = computed((): AccountRow[] => {
    const walletsById = new Map(this.wallets().map((w) => [w.id, w]));
    return [...this.accounts()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((account) => ({
        account,
        walletName: walletsById.get(account.walletId)?.name ?? '—',
      }));
  });

  /** Active income/expense rules — the only ones that feed the surplus. */
  readonly activeRuleCount = computed(
    () =>
      this.recurrings().filter((r) => r.active && r.type !== 'TRANSFER')
        .length,
  );

  readonly outlookRows = computed((): OutlookRow[] =>
    (this.forecast()?.currencies ?? []).map((row) => {
      const income = toBigInt(row.expectedIncomeMinor);
      const expense = toBigInt(row.expectedExpenseMinor);
      const scale = income > expense ? income : expense;
      return {
        ...row,
        shortfall: toBigInt(row.surplusMinor) < 0n,
        incomePct: wholePercent(income, scale),
        expensePct: wholePercent(expense, scale),
        expenseSharePct: income > 0n ? wholePercent(expense, income) : null,
      };
    }),
  );

  readonly outlookMonthLabel = computed(() => {
    const forecast = this.forecast();
    if (!forecast) {
      return '';
    }
    return formatCalendarMonthLabel(
      forecast.year,
      forecast.month,
      forecast.calendar,
      this.locale.activeLang(),
    );
  });

  private readonly walletsApi = inject(WalletsService);
  private readonly txApi = inject(TransactionsService);
  private readonly recurringsApi = inject(RecurringsService);
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
      wallets: this.walletsApi.listWallets(),
      accounts: this.walletsApi.listAccounts(),
      categories: this.txApi.listCategories(),
      transactions: this.txApi.listTransactions(),
      forecast: this.recurringsApi.nextMonthForecast(),
      recurrings: this.recurringsApi.list(),
    }).subscribe({
      next: ({
        wallets,
        accounts,
        categories,
        transactions,
        forecast,
        recurrings,
      }) => {
        this.wallets.set(wallets);
        this.accounts.set(accounts);
        this.categories.set(categories);
        this.recent.set(
          transactions
            .filter((tx) => tx.type === 'INCOME' || tx.type === 'EXPENSE')
            .slice(0, RECENT_LIMIT),
        );
        this.forecast.set(forecast);
        this.recurrings.set(recurrings);
        this.loading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(
          err.error?.message ?? this.i18n.translate('accounts.loadFailed'),
        );
      },
    });
  }

  openAddDialog() {
    this.addDialogVisible.set(true);
  }

  onMovementSaved(event: AddMovementSavedEvent) {
    this.message.set(
      event.type === 'TRANSFER'
        ? this.i18n.translate('activity.transferCreated')
        : this.i18n.translate('activity.created'),
    );
    this.error.set(event.recurringWarning ?? null);
    this.reload();
  }

  currencyName(currency: string): string {
    return currencyLabel(currency, this.locale.activeLang());
  }

  formatBalance(account: PublicAccount): string {
    return formatBalanceMinor(
      account.balanceMinor,
      account.currency,
      this.moneyDisplay.showToman(),
      {
        toman: this.i18n.translate('accounts.toman'),
        rials: this.i18n.translate('accounts.rials'),
        cents: this.i18n.translate('accounts.cents'),
      },
      this.locale.activeLang(),
    );
  }

  accountName(id: string): string {
    return this.accounts().find((a) => a.id === id)?.name ?? id.slice(0, 8);
  }

  formatAmount(tx: PublicTransaction): string {
    const currency =
      this.accounts().find((a) => a.id === tx.accountId)?.currency ?? 'IRR';
    return formatBalanceMinor(
      tx.amountMinor,
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

  typeLabel(type: PublicTransaction['type']): string {
    return this.i18n.translate(`activity.type.${type}`);
  }

  displayCategory(tx: PublicTransaction): string {
    if (!tx.categoryName && !tx.categoryCode) {
      return '';
    }
    return categoryLabel(
      { name: tx.categoryName ?? '', code: tx.categoryCode },
      this.i18n,
    );
  }

  colorVar(color: string | null | undefined): string | null {
    return categoryColorCssVar(color);
  }

  formatCount(value: number): string {
    return new Intl.NumberFormat(this.locale.activeLang()).format(value);
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
}
