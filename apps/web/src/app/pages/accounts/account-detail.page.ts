import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type {
  PublicAccount,
  PublicTransaction,
  PublicWallet,
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

@Component({
  selector: 'app-account-detail-page',
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
  templateUrl: './account-detail.page.html',
  styleUrl: './account-detail.page.scss',
})
export class AccountDetailPage implements OnInit {
  account = signal<PublicAccount | null>(null);
  wallet = signal<PublicWallet | null>(null);
  allAccounts = signal<PublicAccount[]>([]);
  transactions = signal<PublicTransaction[]>([]);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  memberDialogVisible = signal(false);
  movementDialogVisible = signal(false);
  transferDialogVisible = signal(false);
  memberEmail = '';

  movementType: 'INCOME' | 'EXPENSE' = 'EXPENSE';
  movementAmount = '';
  movementOccurredAt = '';
  movementDescription = '';
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
      transactions: this.txApi.listTransactions({ accountId }),
    }).subscribe({
      next: ({ wallets, accounts, transactions }) => {
        const account = accounts.find((item) => item.id === accountId) ?? null;
        this.account.set(account);
        this.allAccounts.set(accounts);
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

  openMemberDialog() {
    this.memberEmail = '';
    this.memberDialogVisible.set(true);
  }

  openMovementDialog(type: 'INCOME' | 'EXPENSE') {
    this.movementType = type;
    this.movementAmount = '';
    this.movementOccurredAt = this.nowLocalInput();
    this.movementDescription = '';
    this.movementShared = false;
    this.movementDialogVisible.set(true);
  }

  openTransferDialog() {
    this.transferAmount = '';
    this.transferOccurredAt = this.nowLocalInput();
    this.transferDescription = '';
    this.transferDialogVisible.set(true);
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

  createMovement() {
    const account = this.account();
    if (!account || !/^\d+$/.test(this.movementAmount.trim())) {
      this.error.set(this.i18n.translate('activity.invalidAmount'));
      return;
    }
    this.error.set(null);
    this.message.set(null);
    const shared =
      this.movementType === 'EXPENSE' &&
      !account.isShared &&
      this.movementShared;
    this.txApi
      .createTransaction({
        type: this.movementType,
        accountId: account.id,
        amountMinor: this.movementAmount.trim(),
        occurredAt: new Date(this.movementOccurredAt).toISOString(),
        description: this.movementDescription.trim() || null,
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
    const account = this.account();
    if (
      !account ||
      !this.transferToId ||
      !/^\d+$/.test(this.transferAmount.trim())
    ) {
      this.error.set(this.i18n.translate('activity.invalidAmount'));
      return;
    }
    this.error.set(null);
    this.message.set(null);
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

  unitLabel(currency: string): string {
    return minorUnitLabel(currency, {
      rials: this.i18n.translate('accounts.rials'),
      cents: this.i18n.translate('accounts.cents'),
    });
  }

  private nowLocalInput(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
