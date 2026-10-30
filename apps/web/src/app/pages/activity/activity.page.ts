import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  PublicAccount,
  PublicCategory,
  PublicTransaction,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { forkJoin } from 'rxjs';
import { formatBalanceMinor, minorUnitLabel } from '../../core/money-display';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { TransactionsService } from '../../core/transactions.service';
import { WalletsService } from '../../core/wallets.service';

type RangeKey = 'all' | '30d' | 'month';

@Component({
  selector: 'app-activity-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonDirective,
    Checkbox,
    Dialog,
    InputText,
    Message,
    Select,
    TranslocoDirective,
  ],
  templateUrl: './activity.page.html',
  styleUrl: './activity.page.scss',
})
export class ActivityPage implements OnInit {
  accounts = signal<PublicAccount[]>([]);
  categories = signal<PublicCategory[]>([]);
  transactions = signal<PublicTransaction[]>([]);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  movementDialogVisible = signal(false);
  transferDialogVisible = signal(false);
  range: RangeKey = '30d';
  filterAccountId = '';

  movementType: 'INCOME' | 'EXPENSE' = 'EXPENSE';
  movementAccountId = '';
  movementAmount = '';
  movementOccurredAt = '';
  movementDescription = '';
  movementCategoryId: string | null = null;
  movementShared = false;

  transferFromId = '';
  transferToId = '';
  transferAmount = '';
  transferOccurredAt = '';
  transferDescription = '';

  readonly accountOptions = computed(() =>
    this.accounts().map((a) => ({
      label: `${a.name} (${a.currency})`,
      value: a.id,
    })),
  );

  readonly filterAccountOptions = computed(() => [
    {
      label: this.i18n.translate('activity.allAccounts'),
      value: '',
    },
    ...this.accountOptions(),
  ]);

  readonly categoryOptions = computed(() => [
    { label: '—', value: null as string | null },
    ...this.categories().map((c) => ({ label: c.name, value: c.id })),
  ]);

  readonly rangeOptions = computed(() => [
    { label: this.i18n.translate('activity.rangeAll'), value: 'all' as const },
    { label: this.i18n.translate('activity.range30d'), value: '30d' as const },
    {
      label: this.i18n.translate('activity.rangeMonth'),
      value: 'month' as const,
    },
  ]);

  private readonly walletsApi = inject(WalletsService);
  private readonly txApi = inject(TransactionsService);
  private readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly i18n = inject(TranslocoService);

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);
    const range = this.rangeBounds(this.range);
    forkJoin({
      accounts: this.walletsApi.listAccounts(),
      categories: this.txApi.listCategories(),
      transactions: this.txApi.listTransactions({
        accountId: this.filterAccountId || undefined,
        from: range.from,
        to: range.to,
      }),
    }).subscribe({
      next: ({ accounts, categories, transactions }) => {
        this.accounts.set(accounts);
        this.categories.set(categories);
        this.transactions.set(transactions);
        if (!this.movementAccountId && accounts[0]) {
          this.movementAccountId = accounts[0].id;
        }
        if (!this.transferFromId && accounts[0]) {
          this.transferFromId = accounts[0].id;
        }
        if (!this.transferToId && accounts[1]) {
          this.transferToId = accounts[1].id;
        }
        this.loading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(
          err.error?.message ?? this.i18n.translate('activity.loadFailed'),
        );
      },
    });
  }

  applyFilters() {
    this.reload();
  }

  openMovementDialog(type: 'INCOME' | 'EXPENSE' = 'EXPENSE') {
    this.movementType = type;
    this.movementAmount = '';
    this.movementOccurredAt = this.nowLocalInput();
    this.movementDescription = '';
    this.movementCategoryId = null;
    this.movementShared = false;
    if (!this.movementAccountId && this.accounts()[0]) {
      this.movementAccountId = this.accounts()[0].id;
    }
    this.movementDialogVisible.set(true);
  }

  openTransferDialog() {
    this.transferAmount = '';
    this.transferOccurredAt = this.nowLocalInput();
    this.transferDescription = '';
    this.transferDialogVisible.set(true);
  }

  selectedMovementAccount(): PublicAccount | undefined {
    return this.accounts().find((a) => a.id === this.movementAccountId);
  }

  createMovement() {
    this.error.set(null);
    this.message.set(null);
    if (!this.movementAccountId || !/^\d+$/.test(this.movementAmount.trim())) {
      this.error.set(this.i18n.translate('activity.invalidAmount'));
      return;
    }
    const account = this.selectedMovementAccount();
    const shared =
      this.movementType === 'EXPENSE' &&
      !!account &&
      !account.isShared &&
      this.movementShared;
    this.txApi
      .createTransaction({
        type: this.movementType,
        accountId: this.movementAccountId,
        amountMinor: this.movementAmount.trim(),
        occurredAt: new Date(this.movementOccurredAt).toISOString(),
        description: this.movementDescription.trim() || null,
        categoryId: this.movementCategoryId,
        shared,
      })
      .subscribe({
        next: () => {
          this.message.set(this.i18n.translate('activity.created'));
          this.movementDialogVisible.set(false);
          this.reload();
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            err.error?.message ?? this.i18n.translate('activity.createFailed'),
          );
        },
      });
  }

  createTransfer() {
    this.error.set(null);
    this.message.set(null);
    if (
      !this.transferFromId ||
      !this.transferToId ||
      !/^\d+$/.test(this.transferAmount.trim())
    ) {
      this.error.set(this.i18n.translate('activity.invalidAmount'));
      return;
    }
    this.txApi
      .createTransaction({
        type: 'TRANSFER',
        accountId: this.transferFromId,
        counterAccountId: this.transferToId,
        amountMinor: this.transferAmount.trim(),
        occurredAt: new Date(this.transferOccurredAt).toISOString(),
        description: this.transferDescription.trim() || null,
      })
      .subscribe({
        next: () => {
          this.message.set(this.i18n.translate('activity.transferCreated'));
          this.transferDialogVisible.set(false);
          this.reload();
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            err.error?.message ?? this.i18n.translate('activity.createFailed'),
          );
        },
      });
  }

  accountName(id: string | null): string {
    if (!id) {
      return '—';
    }
    return this.accounts().find((a) => a.id === id)?.name ?? id.slice(0, 8);
  }

  accountCurrency(id: string): string {
    return this.accounts().find((a) => a.id === id)?.currency ?? '';
  }

  formatAmount(tx: PublicTransaction): string {
    const currency = this.accountCurrency(tx.accountId);
    return formatBalanceMinor(
      tx.amountMinor,
      currency || 'IRR',
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

  unitLabel(currency: string): string {
    return minorUnitLabel(currency, {
      rials: this.i18n.translate('accounts.rials'),
      cents: this.i18n.translate('accounts.cents'),
    });
  }

  private rangeBounds(range: RangeKey): { from?: string; to?: string } {
    const now = new Date();
    if (range === 'all') {
      return {};
    }
    if (range === '30d') {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { from: from.toISOString(), to: now.toISOString() };
    }
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    return { from: from.toISOString(), to: now.toISOString() };
  }

  private nowLocalInput(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
