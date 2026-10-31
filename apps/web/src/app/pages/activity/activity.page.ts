import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  DEFAULT_BOUNDS_TIME_ZONE,
  currentMonthBounds,
  type PublicAccount,
  type PublicCategory,
  type PublicTransaction,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { forkJoin } from 'rxjs';
import { AppDateTimePipe } from '../../core/app-date-time.pipe';
import { AuthService } from '../../core/auth.service';
import { CalendarPreferenceService } from '../../core/calendar-preference.service';
import { formatBalanceMinor, minorUnitLabel } from '../../core/money-display';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { TransactionsService } from '../../core/transactions.service';
import { WalletsService } from '../../core/wallets.service';
import {
  AddMovementDialogComponent,
  type AddMovementSavedEvent,
} from '../../shared/add-movement-dialog/add-movement-dialog.component';
import { AppDateTimeFieldComponent } from '../../shared/app-date-time-field/app-date-time-field.component';

type RangeKey = 'all' | '30d' | 'month';

@Component({
  selector: 'app-activity-page',
  standalone: true,
  imports: [
    AddMovementDialogComponent,
    AppDateTimeFieldComponent,
    AppDateTimePipe,
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
  addDialogVisible = signal(false);
  movementDialogVisible = signal(false);
  transferDialogVisible = signal(false);
  editingTransactionId: string | null = null;
  range: RangeKey = '30d';
  filterAccountId = '';

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
  editingTransferId: string | null = null;

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

  private readonly walletsApi = inject(WalletsService);
  private readonly txApi = inject(TransactionsService);
  private readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly calendarPref = inject(CalendarPreferenceService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslocoService);
  private readonly confirm = inject(ConfirmationService);

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

  categoryOptionsFor(kind: 'INCOME' | 'EXPENSE') {
    return this.categories()
      .filter((c) => c.kind === kind)
      .map((c) => ({
        label: this.categoryLabel(c),
        value: c.id,
      }));
  }

  categoryLabel(category: PublicCategory): string {
    if (category.name === 'Uncategorized') {
      return this.i18n.translate('activity.uncategorized');
    }
    return category.name;
  }

  openEditDialog(tx: PublicTransaction) {
    if (tx.type === 'TRANSFER') {
      this.editingTransferId = tx.id;
      this.transferFromId = tx.accountId;
      this.transferToId = tx.counterAccountId ?? '';
      this.transferAmount = tx.amountMinor;
      this.transferOccurredAt = tx.occurredAt;
      this.transferDescription = tx.description ?? '';
      this.transferDialogVisible.set(true);
      return;
    }
    this.editingTransactionId = tx.id;
    this.movementType = tx.type;
    this.movementAccountId = tx.accountId;
    this.movementAmount = tx.amountMinor;
    this.movementOccurredAt = tx.occurredAt;
    this.movementDescription = tx.description ?? '';
    this.movementCategoryId = tx.categoryId ?? this.defaultCategoryId(tx.type);
    this.movementShared = tx.shared;
    this.movementDialogVisible.set(true);
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
      !/^\d+$/.test(this.transferAmount.trim())
    ) {
      this.error.set(this.i18n.translate('activity.invalidAmount'));
      return;
    }

    this.txApi
      .updateTransaction(this.editingTransferId, {
        amountMinor: this.transferAmount.trim(),
        occurredAt: new Date(this.transferOccurredAt).toISOString(),
        description: this.transferDescription.trim() || null,
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

  displayCategoryName(name: string | null): string {
    if (!name) {
      return '';
    }
    if (name === 'Uncategorized') {
      return this.i18n.translate('activity.uncategorized');
    }
    return name;
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

  private defaultCategoryId(kind: 'INCOME' | 'EXPENSE'): string {
    const list = this.categories().filter((c) => c.kind === kind);
    const preferred =
      list.find((c) => !c.isSystem) ??
      list.find((c) => c.name === 'Uncategorized') ??
      list[0];
    return preferred?.id ?? '';
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
