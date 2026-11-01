import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DEFAULT_BOUNDS_TIME_ZONE,
  type CategoryKind,
  type ImportResult,
  type PublicAccount,
  type PublicCategory,
  type PublicCheckpoint,
  type PublicTransaction,
  type PublicWallet,
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
import { currencyLabel } from '../../core/currencies';
import { formatAppDate, formatAppTime } from '../../core/format-app-date';
import { LocaleService } from '../../core/i18n/locale.service';
import { formatBalanceMinor, minorUnitLabel } from '../../core/money-display';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { CheckpointsService } from '../../core/checkpoints.service';
import { groupTransactionsByDay } from '../../core/transaction-day-groups';
import { TransactionsService } from '../../core/transactions.service';
import { WalletsService } from '../../core/wallets.service';
import {
  AddMovementDialogComponent,
  type AddMovementSavedEvent,
} from '../../shared/add-movement-dialog/add-movement-dialog.component';
import { AppAmountInputComponent } from '../../shared/app-amount-input/app-amount-input.component';
import { AppDateTimeFieldComponent } from '../../shared/app-date-time-field/app-date-time-field.component';
import { ImportDialogComponent } from '../../shared/import-dialog/import-dialog.component';

@Component({
  selector: 'app-account-detail-page',
  standalone: true,
  imports: [
    AddMovementDialogComponent,
    AppAmountInputComponent,
    AppDateTimeFieldComponent,
    ImportDialogComponent,
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
  templateUrl: './account-detail.page.html',
  styleUrl: './account-detail.page.scss',
})
export class AccountDetailPage implements OnInit {
  account = signal<PublicAccount | null>(null);
  wallet = signal<PublicWallet | null>(null);
  allAccounts = signal<PublicAccount[]>([]);
  categories = signal<PublicCategory[]>([]);
  transactions = signal<PublicTransaction[]>([]);
  checkpoints = signal<PublicCheckpoint[]>([]);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  addDialogVisible = signal(false);
  importDialogVisible = signal(false);
  memberDialogVisible = signal(false);
  renameDialogVisible = signal(false);
  checkpointDialogVisible = signal(false);
  movementDialogVisible = signal(false);
  transferDialogVisible = signal(false);
  memberEmail = '';
  renameName = '';
  editingTransactionId: string | null = null;
  editingTransferId: string | null = null;
  editingCheckpointId: string | null = null;
  checkpointBalanceMinor = '0';
  checkpointAsOf = new Date().toISOString();
  checkpointNote = '';

  movementType: 'INCOME' | 'EXPENSE' = 'EXPENSE';
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

  readonly skeletonRows = [0, 1, 2, 3];

  private readonly route = inject(ActivatedRoute);
  private readonly walletsApi = inject(WalletsService);
  private readonly checkpointsApi = inject(CheckpointsService);
  private readonly txApi = inject(TransactionsService);
  private readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly locale = inject(LocaleService);
  private readonly calendarPref = inject(CalendarPreferenceService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslocoService);
  private readonly confirm = inject(ConfirmationService);

  readonly dayGroups = computed(() =>
    groupTransactionsByDay(
      this.transactions(),
      this.calendarPref.calendar(),
      this.auth.user()?.timeZone ?? DEFAULT_BOUNDS_TIME_ZONE,
    ),
  );

  ngOnInit() {
    this.reload();
  }

  reload() {
    const accountId = this.route.snapshot.paramMap.get('accountId');
    if (!accountId) {
      this.error.set(this.i18n.translate('accounts.notFound'));
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      wallets: this.walletsApi.listWallets(),
      accounts: this.walletsApi.listAccounts(),
      categories: this.txApi.listCategories(),
      transactions: this.txApi.listTransactions({ accountId }),
      checkpoints: this.checkpointsApi.listForAccount(accountId),
    }).subscribe({
      next: ({ wallets, accounts, categories, transactions, checkpoints }) => {
        const account = accounts.find((item) => item.id === accountId) ?? null;
        this.account.set(account);
        this.allAccounts.set(accounts);
        this.categories.set(categories);
        this.transactions.set(transactions);
        this.checkpoints.set(checkpoints);
        this.wallet.set(
          account
            ? (wallets.find((w) => w.id === account.walletId) ?? null)
            : null,
        );
        if (!account) {
          this.error.set(this.i18n.translate('accounts.notFound'));
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

  categoryOptionsFor(kind: CategoryKind) {
    return this.categories()
      .filter((c) => c.kind === kind)
      .map((c) => categoryOptionFrom(c, this.i18n));
  }

  colorVar(color: string | null | undefined): string | null {
    return categoryColorCssVar(color);
  }

  openAddDialog() {
    this.addDialogVisible.set(true);
  }

  openImportDialog() {
    this.importDialogVisible.set(true);
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

  onImported(result: ImportResult) {
    this.message.set(
      this.i18n.translate('importPage.result', {
        created: result.created,
        skipped: result.skippedDuplicate,
      }),
    );
    this.error.set(null);
    this.reload();
  }

  openMemberDialog() {
    this.memberEmail = '';
    this.memberDialogVisible.set(true);
  }

  openRenameDialog() {
    const account = this.account();
    if (!account) {
      return;
    }
    this.renameName = account.name;
    this.renameDialogVisible.set(true);
  }

  openCheckpointDialog(cp?: PublicCheckpoint) {
    if (cp) {
      this.editingCheckpointId = cp.id;
      this.checkpointBalanceMinor = cp.balanceMinor;
      this.checkpointAsOf = cp.asOf;
      this.checkpointNote = cp.note ?? '';
    } else {
      this.editingCheckpointId = null;
      this.checkpointBalanceMinor = '0';
      this.checkpointAsOf = new Date().toISOString();
      this.checkpointNote = '';
    }
    this.checkpointDialogVisible.set(true);
  }

  saveCheckpoint() {
    const account = this.account();
    if (!account) {
      return;
    }
    if (!/^-?\d+$/.test(this.checkpointBalanceMinor.trim())) {
      this.error.set(this.i18n.translate('accounts.invalidInitialBalance'));
      return;
    }
    if (!this.checkpointAsOf) {
      this.error.set(this.i18n.translate('accounts.invalidInitialAsOf'));
      return;
    }
    this.error.set(null);
    this.message.set(null);
    const payload = {
      asOf: new Date(this.checkpointAsOf).toISOString(),
      balanceMinor: this.checkpointBalanceMinor.trim(),
      note: this.checkpointNote.trim() || null,
    };
    const req = this.editingCheckpointId
      ? this.checkpointsApi.update(this.editingCheckpointId, payload)
      : this.checkpointsApi.create(account.id, payload);
    req.subscribe({
      next: () => {
        this.message.set(
          this.i18n.translate(
            this.editingCheckpointId
              ? 'accounts.checkpointUpdated'
              : 'accounts.checkpointCreated',
          ),
        );
        this.checkpointDialogVisible.set(false);
        this.reload();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ??
            this.i18n.translate('accounts.checkpointSaveFailed'),
        );
      },
    });
  }

  confirmDeleteCheckpoint(cp: PublicCheckpoint) {
    this.confirm.confirm({
      message: this.i18n.translate('accounts.confirmDeleteCheckpoint'),
      header: this.i18n.translate('accounts.deleteCheckpoint'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.checkpointsApi.remove(cp.id).subscribe({
          next: () => {
            this.message.set(
              this.i18n.translate('accounts.checkpointDeleted'),
            );
            this.checkpointDialogVisible.set(false);
            this.reload();
          },
          error: (err: { error?: { message?: string } }) => {
            this.error.set(
              err.error?.message ??
                this.i18n.translate('accounts.checkpointDeleteFailed'),
            );
          },
        });
      },
    });
  }

  deleteCheckpointFromDialog() {
    const id = this.editingCheckpointId;
    if (!id) {
      return;
    }
    const cp = this.checkpoints().find((row) => row.id === id);
    if (!cp) {
      return;
    }
    this.confirmDeleteCheckpoint(cp);
  }

  saveRename() {
    const account = this.account();
    const name = this.renameName.trim();
    if (!account || !name) {
      return;
    }
    this.error.set(null);
    this.message.set(null);
    this.walletsApi.updateAccount(account.id, { name }).subscribe({
      next: (updated) => {
        this.account.set(updated);
        this.message.set(this.i18n.translate('accounts.accountRenamed'));
        this.renameDialogVisible.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ??
            this.i18n.translate('accounts.accountRenameFailed'),
        );
      },
    });
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

  onCheckpointRowKeydown(event: KeyboardEvent, cp: PublicCheckpoint) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openCheckpointDialog(cp);
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

  addMember() {
    const account = this.account();
    if (!account || !this.memberEmail.trim()) {
      this.error.set(this.i18n.translate('accounts.memberRequired'));
      return;
    }
    this.error.set(null);
    this.message.set(null);
    this.walletsApi.addMember(account.id, this.memberEmail.trim()).subscribe({
      next: (updated) => {
        this.account.set(updated);
        this.message.set(this.i18n.translate('accounts.memberAdded'));
        this.memberDialogVisible.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('accounts.memberAddFailed'),
        );
      },
    });
  }

  confirmRemoveMember(member: {
    userId: string;
    displayName: string;
    email: string;
  }) {
    const account = this.account();
    if (!account) {
      return;
    }
    this.confirm.confirm({
      message: this.i18n.translate('accounts.confirmRemoveMember', {
        name: member.displayName || member.email,
      }),
      header: this.i18n.translate('accounts.removeMember'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.error.set(null);
        this.message.set(null);
        this.walletsApi.removeMember(account.id, member.userId).subscribe({
          next: (updated) => {
            this.account.set(updated);
            this.message.set(this.i18n.translate('accounts.memberRemoved'));
          },
          error: (err: { error?: { message?: string } }) => {
            this.error.set(
              err.error?.message ??
                this.i18n.translate('accounts.memberRemoveFailed'),
            );
          },
        });
      },
    });
  }

  saveMovement() {
    const account = this.account();
    if (
      !account ||
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
    this.error.set(null);
    this.message.set(null);
    const shared =
      this.movementType === 'EXPENSE' &&
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
    this.error.set(null);
    this.message.set(null);

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

  formatAmount(tx: PublicTransaction, currency: string): string {
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

  formatCheckpointBalance(minor: string, currency: string): string {
    return formatBalanceMinor(
      minor,
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

  gapLabel(cp: PublicCheckpoint, currency: string): string | null {
    if (cp.gapMinor === null) {
      return null;
    }
    if (cp.gapMinor === '0') {
      return this.i18n.translate('accounts.gapMatched');
    }
    return this.i18n.translate('accounts.gapAmount', {
      amount: this.formatCheckpointBalance(cp.gapMinor, currency),
    });
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

  counterName(id: string | null): string {
    if (!id) {
      return '—';
    }
    return this.allAccounts().find((a) => a.id === id)?.name ?? id.slice(0, 8);
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
}
