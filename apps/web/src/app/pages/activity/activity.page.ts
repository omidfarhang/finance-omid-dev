import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  DEFAULT_BOUNDS_TIME_ZONE,
  currentMonthBounds,
  type CategoryKind,
  type PublicAccount,
  type PublicCategory,
  type PublicTransaction,
  type TransactionType,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { CalendarPreferenceService } from '../../core/calendar-preference.service';
import {
  categoryColorCssVar,
  categoryLabel,
  categoryOptionFrom,
  defaultCategoryId,
} from '../../core/category-display';
import { formatAppDate, formatAppTime } from '../../core/format-app-date';
import { LocaleService } from '../../core/i18n/locale.service';
import { formatBalanceMinor, minorUnitLabel } from '../../core/money-display';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { TransactionsService } from '../../core/transactions.service';
import { WalletsService } from '../../core/wallets.service';
import {
  AddMovementDialogComponent,
  type AddMovementSavedEvent,
} from '../../shared/add-movement-dialog/add-movement-dialog.component';
import { AppAmountInputComponent } from '../../shared/app-amount-input/app-amount-input.component';
import { AppDateTimeFieldComponent } from '../../shared/app-date-time-field/app-date-time-field.component';
import { groupTransactionsByDay } from './activity-day-groups';

type RangeKey = 'all' | '30d' | 'month';
type TypeFilterKey = '' | TransactionType;

type CurrencySummary = {
  currency: string;
  incomeMinor: bigint;
  expenseMinor: bigint;
  transferMinor: bigint;
  netMinor: bigint;
};

@Component({
  selector: 'app-activity-page',
  standalone: true,
  imports: [
    AddMovementDialogComponent,
    AppAmountInputComponent,
    AppDateTimeFieldComponent,
    FormsModule,
    RouterLink,
    ButtonDirective,
    Checkbox,
    Dialog,
    InputText,
    Message,
    Select,
    Skeleton,
    TranslocoDirective,
  ],
  templateUrl: './activity.page.html',
  styleUrl: './activity.page.scss',
})
export class ActivityPage implements OnInit, OnDestroy {
  accounts = signal<PublicAccount[]>([]);
  categories = signal<PublicCategory[]>([]);
  transactions = signal<PublicTransaction[]>([]);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  addDialogVisible = signal(false);
  movementDialogVisible = signal(false);
  transferDialogVisible = signal(false);
  editingTransactionId: string | null = null;
  range: RangeKey = '30d';
  filterAccountId = '';
  filterType: TypeFilterKey = '';
  searchDraft = '';
  searchQuery = signal('');

  movementType: 'INCOME' | 'EXPENSE' = 'EXPENSE';
  movementAccountId = '';
  movementAmount = '';
  movementOccurredAt = '';
  movementDescription = '';
  movementCategoryId = '';
  movementShared = false;

  transferFromId = '';
  transferToId = '';
  transferAmount = '';
  transferOccurredAt = '';
  transferDescription = '';
  transferCategoryId = '';
  editingTransferId: string | null = null;

  readonly skeletonRows = [0, 1, 2, 3, 4];
  readonly skeletonSummary = [0, 1];

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

  readonly rangeOptions = computed(() => [
    { label: this.i18n.translate('activity.rangeAll'), value: 'all' as const },
    { label: this.i18n.translate('activity.range30d'), value: '30d' as const },
    {
      label: this.i18n.translate('activity.rangeMonth'),
      value: 'month' as const,
    },
  ]);

  readonly typeFilterOptions = computed(() => [
    {
      label: this.i18n.translate('activity.typeAll'),
      value: '' as const,
    },
    {
      label: this.i18n.translate('activity.type.INCOME'),
      value: 'INCOME' as const,
    },
    {
      label: this.i18n.translate('activity.type.EXPENSE'),
      value: 'EXPENSE' as const,
    },
    {
      label: this.i18n.translate('activity.type.TRANSFER'),
      value: 'TRANSFER' as const,
    },
  ]);

  readonly visibleTransactions = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const rows = this.transactions();
    if (!q) {
      return rows;
    }
    return rows.filter((tx) => this.matchesSearch(tx, q));
  });

  readonly dayGroups = computed(() =>
    groupTransactionsByDay(
      this.visibleTransactions(),
      this.calendarPref.calendar(),
      this.auth.user()?.timeZone ?? DEFAULT_BOUNDS_TIME_ZONE,
    ),
  );

  readonly periodSummaries = computed((): CurrencySummary[] => {
    const byCurrency = new Map<string, CurrencySummary>();
    for (const tx of this.visibleTransactions()) {
      const currency = this.accountCurrency(tx.accountId) || 'IRR';
      let row = byCurrency.get(currency);
      if (!row) {
        row = {
          currency,
          incomeMinor: 0n,
          expenseMinor: 0n,
          transferMinor: 0n,
          netMinor: 0n,
        };
        byCurrency.set(currency, row);
      }
      const amount = BigInt(tx.amountMinor);
      if (tx.type === 'INCOME') {
        row.incomeMinor += amount;
      } else if (tx.type === 'EXPENSE') {
        row.expenseMinor += amount;
      } else {
        row.transferMinor += amount;
      }
    }
    for (const row of byCurrency.values()) {
      row.netMinor = row.incomeMinor - row.expenseMinor;
    }
    return [...byCurrency.values()].sort((a, b) =>
      a.currency.localeCompare(b.currency),
    );
  });

  private readonly walletsApi = inject(WalletsService);
  private readonly txApi = inject(TransactionsService);
  private readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly locale = inject(LocaleService);
  private readonly calendarPref = inject(CalendarPreferenceService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslocoService);
  private readonly confirm = inject(ConfirmationService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.reload();
  }

  ngOnDestroy() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  onServerFiltersChange() {
    this.reload();
  }

  filtersNarrowed(): boolean {
    return (
      this.range !== 'all' ||
      this.filterAccountId !== '' ||
      this.filterType !== ''
    );
  }

  showTransfersInSummary(): boolean {
    return this.filterType === '' || this.filterType === 'TRANSFER';
  }

  onSearchDraftChange(value: string) {
    this.searchDraft = value;
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.searchQuery.set(this.searchDraft.trim());
    }, 200);
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
        type: this.filterType || undefined,
      }),
    }).subscribe({
      next: ({ accounts, categories, transactions }) => {
        this.accounts.set(accounts);
        this.categories.set(categories);
        this.transactions.set(transactions);
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

  openAddDialog() {
    this.addDialogVisible.set(true);
  }

  onMovementSaved(event: AddMovementSavedEvent) {
    this.message.set(
      event.type === 'TRANSFER'
        ? this.i18n.translate('activity.transferCreated')
        : this.i18n.translate('activity.created'),
    );
    this.reload();
  }

  categoryOptionsFor(kind: CategoryKind) {
    return this.categories()
      .filter((c) => c.kind === kind)
      .map((c) => categoryOptionFrom(c, this.i18n));
  }

  colorVar(color: string | null | undefined): string | null {
    return categoryColorCssVar(color);
  }

  openEditDialog(tx: PublicTransaction) {
    if (tx.type === 'TRANSFER') {
      this.editingTransferId = tx.id;
      this.editingTransactionId = null;
      this.transferFromId = tx.accountId;
      this.transferToId = tx.counterAccountId ?? '';
      this.transferAmount = tx.amountMinor;
      this.transferOccurredAt = tx.occurredAt;
      this.transferDescription = tx.description ?? '';
      this.transferCategoryId =
        tx.categoryId ?? defaultCategoryId(this.categories(), 'TRANSFER');
      this.transferDialogVisible.set(true);
      return;
    }
    this.editingTransactionId = tx.id;
    this.editingTransferId = null;
    this.movementType = tx.type;
    this.movementAccountId = tx.accountId;
    this.movementAmount = tx.amountMinor;
    this.movementOccurredAt = tx.occurredAt;
    this.movementDescription = tx.description ?? '';
    this.movementCategoryId =
      tx.categoryId ?? defaultCategoryId(this.categories(), tx.type);
    this.movementShared = tx.shared;
    this.movementDialogVisible.set(true);
  }

  onRowKeydown(event: KeyboardEvent, tx: PublicTransaction) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openEditDialog(tx);
    }
  }

  confirmDelete(tx: PublicTransaction) {
    this.confirm.confirm({
      message: this.i18n.translate('activity.confirmDelete'),
      header: this.i18n.translate('activity.delete'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteTransaction(tx.id),
    });
  }

  deleteFromEditDialog() {
    const id = this.editingTransactionId ?? this.editingTransferId;
    if (!id) {
      return;
    }
    const tx = this.transactions().find((row) => row.id === id);
    if (!tx) {
      return;
    }
    this.movementDialogVisible.set(false);
    this.transferDialogVisible.set(false);
    this.confirmDelete(tx);
  }

  selectedMovementAccount(): PublicAccount | undefined {
    return this.accounts().find((a) => a.id === this.movementAccountId);
  }

  saveMovement() {
    this.error.set(null);
    this.message.set(null);
    if (
      !this.editingTransactionId ||
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

    const account = this.selectedMovementAccount();
    const shared =
      this.movementType === 'EXPENSE' &&
      !!account &&
      !account.isShared &&
      this.movementShared;
    this.txApi
      .updateTransaction(this.editingTransactionId, {
        amountMinor: this.movementAmount.trim(),
        occurredAt: new Date(this.movementOccurredAt).toISOString(),
        description: this.movementDescription.trim() || null,
        categoryId: this.movementCategoryId,
        shared,
      })
      .subscribe({
        next: () => {
          this.message.set(this.i18n.translate('activity.updated'));
          this.movementDialogVisible.set(false);
          this.reload();
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            err.error?.message ?? this.i18n.translate('activity.updateFailed'),
          );
        },
      });
  }

  saveTransfer() {
    this.error.set(null);
    this.message.set(null);
    if (
      !this.editingTransferId ||
      !this.transferCategoryId ||
      !/^\d+$/.test(this.transferAmount.trim())
    ) {
      this.error.set(
        !this.transferCategoryId
          ? this.i18n.translate('activity.categoryRequired')
          : this.i18n.translate('activity.invalidAmount'),
      );
      return;
    }

    this.txApi
      .updateTransaction(this.editingTransferId, {
        amountMinor: this.transferAmount.trim(),
        occurredAt: new Date(this.transferOccurredAt).toISOString(),
        description: this.transferDescription.trim() || null,
        categoryId: this.transferCategoryId,
      })
      .subscribe({
        next: () => {
          this.message.set(this.i18n.translate('activity.updated'));
          this.transferDialogVisible.set(false);
          this.reload();
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            err.error?.message ?? this.i18n.translate('activity.updateFailed'),
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
      this.locale.activeLang(),
    );
  }

  formatSummaryAmount(amountMinor: bigint, currency: string): string {
    return formatBalanceMinor(
      amountMinor.toString(),
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

  dayLabel(sampleIso: string): string {
    return formatAppDate(
      sampleIso,
      this.calendarPref.calendar(),
      this.auth.user()?.timeZone ?? DEFAULT_BOUNDS_TIME_ZONE,
      this.locale.activeLang(),
    );
  }

  timeLabel(iso: string): string {
    return formatAppTime(
      iso,
      this.calendarPref.calendar(),
      this.auth.user()?.timeZone ?? DEFAULT_BOUNDS_TIME_ZONE,
      this.locale.activeLang(),
    );
  }

  typeLabel(type: PublicTransaction['type']): string {
    return this.i18n.translate(`activity.type.${type}`);
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

  displayCategory(tx: PublicTransaction): string {
    if (!tx.categoryName && !tx.categoryCode) {
      return '';
    }
    return categoryLabel(
      { name: tx.categoryName ?? '', code: tx.categoryCode },
      this.i18n,
    );
  }

  private matchesSearch(tx: PublicTransaction, q: string): boolean {
    const haystacks = [
      tx.description ?? '',
      this.displayCategory(tx),
      this.accountName(tx.accountId),
      this.accountName(tx.counterAccountId),
      this.typeLabel(tx.type),
    ];
    return haystacks.some((value) => value.toLowerCase().includes(q));
  }

  private deleteTransaction(id: string) {
    this.error.set(null);
    this.message.set(null);
    this.txApi.deleteTransaction(id).subscribe({
      next: () => {
        this.message.set(this.i18n.translate('activity.deleted'));
        this.reload();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('activity.deleteFailed'),
        );
      },
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
    const bounds = currentMonthBounds(
      now,
      this.calendarPref.calendar(),
      this.auth.user()?.timeZone ?? DEFAULT_BOUNDS_TIME_ZONE,
    );
    return { from: bounds.fromIso, to: now.toISOString() };
  }
}
