import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type {
  PublicAccount,
  PublicCategory,
  PublicTransaction,
  PublicWallet,
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
import { formatBalanceMinor, minorUnitLabel } from '../../core/money-display';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { TransactionsService } from '../../core/transactions.service';
import { WalletsService } from '../../core/wallets.service';
import { AppDateTimeFieldComponent } from '../../shared/app-date-time-field/app-date-time-field.component';

@Component({
  selector: 'app-account-detail-page',
  standalone: true,
  imports: [
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
  templateUrl: './account-detail.page.html',
  styleUrl: './account-detail.page.scss',
})
export class AccountDetailPage implements OnInit {
  account = signal<PublicAccount | null>(null);
  wallet = signal<PublicWallet | null>(null);
  allAccounts = signal<PublicAccount[]>([]);
  categories = signal<PublicCategory[]>([]);
  transactions = signal<PublicTransaction[]>([]);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  memberDialogVisible = signal(false);
  movementDialogVisible = signal(false);
  transferDialogVisible = signal(false);
  memberEmail = '';
  editingTransactionId: string | null = null;
  editingTransferId: string | null = null;

  movementType: 'INCOME' | 'EXPENSE' = 'EXPENSE';
  movementAmount = '';
  movementOccurredAt = '';
  movementDescription = '';
  movementCategoryId = '';
  movementShared = false;

  transferToId = '';
  transferAmount = '';
  transferOccurredAt = '';
  transferDescription = '';

  readonly transferToOptions = computed(() => {
    const current = this.account();
    return this.allAccounts()
      .filter(
        (a) =>
          a.id !== current?.id &&
          (!current || a.currency === current.currency),
      )
      .map((a) => ({ label: `${a.name} (${a.currency})`, value: a.id }));
  });

  private readonly route = inject(ActivatedRoute);
  private readonly walletsApi = inject(WalletsService);
  private readonly txApi = inject(TransactionsService);
  private readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly i18n = inject(TranslocoService);
  private readonly confirm = inject(ConfirmationService);

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
    }).subscribe({
      next: ({ wallets, accounts, categories, transactions }) => {
        const account = accounts.find((item) => item.id === accountId) ?? null;
        this.account.set(account);
        this.allAccounts.set(accounts);
        this.categories.set(categories);
        this.transactions.set(transactions);
        this.wallet.set(
          account
            ? (wallets.find((w) => w.id === account.walletId) ?? null)
            : null,
        );
        if (!account) {
          this.error.set(this.i18n.translate('accounts.notFound'));
        }
        const other = accounts.find(
          (a) =>
            a.id !== accountId &&
            (!account || a.currency === account.currency),
        );
        if (other) {
          this.transferToId = other.id;
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

  openMemberDialog() {
    this.memberEmail = '';
    this.memberDialogVisible.set(true);
  }

  openMovementDialog(type: 'INCOME' | 'EXPENSE') {
    this.editingTransactionId = null;
    this.movementType = type;
    this.movementAmount = '';
    this.movementOccurredAt = new Date().toISOString();
    this.movementDescription = '';
    this.movementCategoryId = this.defaultCategoryId(type);
    this.movementShared = false;
    this.movementDialogVisible.set(true);
  }

  openEditDialog(tx: PublicTransaction) {
    if (tx.type === 'TRANSFER') {
      this.editingTransferId = tx.id;
      this.transferToId = tx.counterAccountId ?? this.transferToId;
      this.transferAmount = tx.amountMinor;
      this.transferOccurredAt = tx.occurredAt;
      this.transferDescription = tx.description ?? '';
      this.transferDialogVisible.set(true);
      return;
    }
    this.editingTransactionId = tx.id;
    this.movementType = tx.type;
    this.movementAmount = tx.amountMinor;
    this.movementOccurredAt = tx.occurredAt;
    this.movementDescription = tx.description ?? '';
    this.movementCategoryId = tx.categoryId ?? this.defaultCategoryId(tx.type);
    this.movementShared = tx.shared;
    this.movementDialogVisible.set(true);
  }

  openTransferDialog() {
    this.editingTransferId = null;
    this.transferAmount = '';
    this.transferOccurredAt = new Date().toISOString();
    this.transferDescription = '';
    this.transferDialogVisible.set(true);
  }

  confirmDelete(tx: PublicTransaction) {
    this.confirm.confirm({
      message: this.i18n.translate('activity.confirmDelete'),
      header: this.i18n.translate('activity.delete'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.error.set(null);
        this.message.set(null);
        this.txApi.deleteTransaction(tx.id).subscribe({
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
      },
    });
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

  saveMovement() {
    const account = this.account();
    if (
      !account ||
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

    if (this.editingTransactionId) {
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
      return;
    }

    this.txApi
      .createTransaction({
        type: this.movementType,
        accountId: account.id,
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

  saveTransfer() {
    const account = this.account();
    if (!/^\d+$/.test(this.transferAmount.trim())) {
      this.error.set(this.i18n.translate('activity.invalidAmount'));
      return;
    }
    this.error.set(null);
    this.message.set(null);

    if (this.editingTransferId) {
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
      return;
    }

    if (!account || !this.transferToId) {
      this.error.set(this.i18n.translate('activity.invalidAmount'));
      return;
    }
    this.txApi
      .createTransaction({
        type: 'TRANSFER',
        accountId: account.id,
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

  private defaultCategoryId(kind: 'INCOME' | 'EXPENSE'): string {
    const list = this.categories().filter((c) => c.kind === kind);
    const preferred =
      list.find((c) => !c.isSystem) ??
      list.find((c) => c.name === 'Uncategorized') ??
      list[0];
    return preferred?.id ?? '';
  }

}
