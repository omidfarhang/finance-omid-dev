import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  NextMonthForecast,
  PublicAccount,
  PublicCategory,
  PublicWallet,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { forkJoin } from 'rxjs';
import { formatBalanceMinor, minorUnitLabel } from '../../core/money-display';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { RecurringsService } from '../../core/recurrings.service';
import { TransactionsService } from '../../core/transactions.service';
import { WalletsService } from '../../core/wallets.service';

type CurrencyGroup = {
  currency: string;
  accounts: Array<{
    account: PublicAccount;
    walletName: string;
  }>;
};

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonDirective,
    InputText,
    Message,
    Select,
    TranslocoDirective,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  wallets = signal<PublicWallet[]>([]);
  accounts = signal<PublicAccount[]>([]);
  categories = signal<PublicCategory[]>([]);
  forecast = signal<NextMonthForecast | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  message = signal<string | null>(null);

  quickType: 'INCOME' | 'EXPENSE' = 'EXPENSE';
  quickAccountId = '';
  quickAmount = '';
  quickCategoryId = '';

  readonly currencyGroups = computed((): CurrencyGroup[] => {
    const walletsById = new Map(this.wallets().map((w) => [w.id, w]));
    const byCurrency = new Map<string, CurrencyGroup['accounts']>();
    for (const account of this.accounts()) {
      const list = byCurrency.get(account.currency) ?? [];
      list.push({
        account,
        walletName: walletsById.get(account.walletId)?.name ?? '—',
      });
      byCurrency.set(account.currency, list);
    }
    return [...byCurrency.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([currency, accounts]) => ({ currency, accounts }));
  });

  readonly accountOptions = computed(() =>
    this.accounts().map((a) => ({
      label: `${a.name} (${a.currency})`,
      value: a.id,
    })),
  );

  readonly typeOptions = computed(() => [
    { label: this.i18n.translate('activity.type.INCOME'), value: 'INCOME' },
    { label: this.i18n.translate('activity.type.EXPENSE'), value: 'EXPENSE' },
  ]);

  private readonly walletsApi = inject(WalletsService);
  private readonly txApi = inject(TransactionsService);
  private readonly recurringsApi = inject(RecurringsService);
  private readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
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
      forecast: this.recurringsApi.nextMonthForecast(),
    }).subscribe({
      next: ({ wallets, accounts, categories, forecast }) => {
        this.wallets.set(wallets);
        this.accounts.set(accounts);
        this.categories.set(categories);
        this.forecast.set(forecast);
        if (!this.quickAccountId && accounts[0]) {
          this.quickAccountId = accounts[0].id;
        }
        this.ensureQuickCategory();
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

  onQuickTypeChange(type: 'INCOME' | 'EXPENSE') {
    this.quickType = type;
    this.ensureQuickCategory();
  }

  categoryOptionsFor(kind: 'INCOME' | 'EXPENSE') {
    return this.categories()
      .filter((c) => c.kind === kind)
      .map((c) => ({
        label:
          c.name === 'Uncategorized'
            ? this.i18n.translate('activity.uncategorized')
            : c.name,
        value: c.id,
      }));
  }

  selectedAccount(): PublicAccount | undefined {
    return this.accounts().find((a) => a.id === this.quickAccountId);
  }

  submitQuickAdd() {
    this.error.set(null);
    this.message.set(null);
    if (
      !this.quickAccountId ||
      !this.quickCategoryId ||
      !/^\d+$/.test(this.quickAmount.trim())
    ) {
      this.error.set(
        !this.quickCategoryId
          ? this.i18n.translate('activity.categoryRequired')
          : this.i18n.translate('activity.invalidAmount'),
      );
      return;
    }
    this.txApi
      .createTransaction({
        type: this.quickType,
        accountId: this.quickAccountId,
        amountMinor: this.quickAmount.trim(),
        occurredAt: new Date().toISOString(),
        categoryId: this.quickCategoryId,
        shared: false,
      })
      .subscribe({
        next: () => {
          this.message.set(this.i18n.translate('activity.created'));
          this.quickAmount = '';
          this.reload();
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            err.error?.message ?? this.i18n.translate('activity.createFailed'),
          );
        },
      });
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
    );
  }

  currencySubtotal(group: CurrencyGroup): string {
    const total = group.accounts.reduce(
      (sum, row) => sum + BigInt(row.account.balanceMinor),
      0n,
    );
    return formatBalanceMinor(
      total.toString(),
      group.currency,
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

  private ensureQuickCategory() {
    const options = this.categoryOptionsFor(this.quickType);
    if (!options.some((o) => o.value === this.quickCategoryId)) {
      this.quickCategoryId = options[0]?.value ?? '';
    }
  }
}
