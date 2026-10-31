import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  NextMonthForecast,
  PublicAccount,
  PublicCategory,
  PublicTransaction,
  PublicWallet,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { forkJoin } from 'rxjs';
import { AppDateTimePipe } from '../../core/app-date-time.pipe';
import { formatBalanceMinor, minorUnitLabel } from '../../core/money-display';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { RecurringsService } from '../../core/recurrings.service';
import { TransactionsService } from '../../core/transactions.service';
import { WalletsService } from '../../core/wallets.service';
import { AppDateTimeFieldComponent } from '../../shared/app-date-time-field/app-date-time-field.component';

const RECENT_LIMIT = 8;

type AccountRow = {
  account: PublicAccount;
  walletName: string;
};

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    AppDateTimeFieldComponent,
    AppDateTimePipe,
    FormsModule,
    RouterLink,
    ButtonDirective,
    Dialog,
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
  recent = signal<PublicTransaction[]>([]);
  forecast = signal<NextMonthForecast | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  message = signal<string | null>(null);
  addDialogVisible = signal(false);

  movementType: 'INCOME' | 'EXPENSE' = 'EXPENSE';
  movementAccountId = '';
  movementAmount = '';
  movementOccurredAt = '';
  movementDescription = '';
  movementCategoryId = '';

  readonly accountRows = computed((): AccountRow[] => {
    const walletsById = new Map(this.wallets().map((w) => [w.id, w]));
    return [...this.accounts()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((account) => ({
        account,
        walletName: walletsById.get(account.walletId)?.name ?? '—',
      }));
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
      transactions: this.txApi.listTransactions(),
      forecast: this.recurringsApi.nextMonthForecast(),
    }).subscribe({
      next: ({ wallets, accounts, categories, transactions, forecast }) => {
        this.wallets.set(wallets);
        this.accounts.set(accounts);
        this.categories.set(categories);
        this.recent.set(
          transactions
            .filter((tx) => tx.type === 'INCOME' || tx.type === 'EXPENSE')
            .slice(0, RECENT_LIMIT),
        );
        this.forecast.set(forecast);
        if (!this.movementAccountId && accounts[0]) {
          this.movementAccountId = accounts[0].id;
        }
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
    this.movementType = 'EXPENSE';
    this.movementAmount = '';
    this.movementOccurredAt = new Date().toISOString();
    this.movementDescription = '';
    this.movementCategoryId = this.defaultCategoryId('EXPENSE');
    if (!this.movementAccountId && this.accounts()[0]) {
      this.movementAccountId = this.accounts()[0].id;
    }
    this.addDialogVisible.set(true);
  }

  onMovementTypeChange(type: 'INCOME' | 'EXPENSE') {
    this.movementType = type;
    this.movementCategoryId = this.defaultCategoryId(type);
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

  selectedMovementAccount(): PublicAccount | undefined {
    return this.accounts().find((a) => a.id === this.movementAccountId);
  }

  saveMovement() {
    this.error.set(null);
    this.message.set(null);
    if (
      !this.movementAccountId ||
      !this.movementCategoryId ||
      !/^\d+$/.test(this.movementAmount.trim())
    ) {
      this.error.set(
        !this.movementCategoryId
          ? this.i18n.translate('activity.categoryRequired')
          : this.i18n.translate('activity.invalidAmount'),
      );
      return;
    }
    this.txApi
      .createTransaction({
        type: this.movementType,
        accountId: this.movementAccountId,
        amountMinor: this.movementAmount.trim(),
        occurredAt: new Date(this.movementOccurredAt).toISOString(),
        description: this.movementDescription.trim() || null,
        categoryId: this.movementCategoryId,
        shared: false,
      })
      .subscribe({
        next: () => {
          this.message.set(this.i18n.translate('activity.created'));
          this.addDialogVisible.set(false);
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
    );
  }

  typeLabel(type: PublicTransaction['type']): string {
    return this.i18n.translate(`activity.type.${type}`);
  }

  displayCategoryName(name: string | null): string {
    if (!name) {
      return '';
    }
    if (name === 'Uncategorized') {
      return this.i18n.translate('activity.uncategorized');
    }
    return name;
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

  private defaultCategoryId(kind: 'INCOME' | 'EXPENSE'): string {
    const list = this.categories().filter((c) => c.kind === kind);
    const preferred =
      list.find((c) => !c.isSystem) ??
      list.find((c) => c.name === 'Uncategorized') ??
      list[0];
    return preferred?.id ?? '';
  }
}
