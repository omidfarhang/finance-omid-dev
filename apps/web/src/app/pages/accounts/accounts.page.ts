import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { PublicAccount, PublicWallet } from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { forkJoin } from 'rxjs';
import {
  currencyLabel,
  currencyOptions,
  type UiCurrency,
} from '../../core/currencies';
import { LocaleService } from '../../core/i18n/locale.service';
import { formatBalanceMinor, minorUnitLabel } from '../../core/money-display';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { WalletsService } from '../../core/wallets.service';
import { AppAmountInputComponent } from '../../shared/app-amount-input/app-amount-input.component';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [
    AppAmountInputComponent,
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
  templateUrl: './accounts.page.html',
  styleUrl: './accounts.page.scss',
})
export class AccountsPage implements OnInit {
  wallets = signal<PublicWallet[]>([]);
  accounts = signal<PublicAccount[]>([]);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  walletDialogVisible = signal(false);
  accountDialogVisible = signal(false);

  walletName = 'Personal';
  accountWalletId = '';
  accountName = '';
  accountCurrency: UiCurrency = 'IRR';
  openingBalanceMinor = '0';
  isShared = false;

  readonly skeletonRows = [0, 1, 2, 3];

  private readonly walletsApi = inject(WalletsService);
  private readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly locale = inject(LocaleService);
  private readonly i18n = inject(TranslocoService);

  readonly currencies = computed(() =>
    currencyOptions(this.locale.activeLang()),
  );

  readonly accountsByWallet = computed(() => {
    const map = new Map<string, PublicAccount[]>();
    for (const account of this.accounts()) {
      const list = map.get(account.walletId) ?? [];
      list.push(account);
      map.set(account.walletId, list);
    }
    return map;
  });

  readonly walletOptions = computed(() =>
    this.wallets().map((w) => ({ label: w.name, value: w.id })),
  );

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      wallets: this.walletsApi.listWallets(),
      accounts: this.walletsApi.listAccounts(),
    }).subscribe({
      next: ({ wallets, accounts }) => {
        this.wallets.set(wallets);
        this.accounts.set(accounts);
        if (!this.accountWalletId && wallets[0]) {
          this.accountWalletId = wallets[0].id;
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

  openWalletDialog() {
    this.walletName = 'Personal';
    this.walletDialogVisible.set(true);
  }

  openAccountDialog(walletId?: string) {
    if (walletId) {
      this.accountWalletId = walletId;
    } else if (!this.accountWalletId && this.wallets()[0]) {
      this.accountWalletId = this.wallets()[0].id;
    }
    this.accountName = '';
    this.accountCurrency = 'IRR';
    this.openingBalanceMinor = '0';
    this.isShared = false;
    this.accountDialogVisible.set(true);
  }

  createWallet() {
    this.error.set(null);
    this.message.set(null);
    this.walletsApi
      .createWallet(this.walletName.trim() || 'Personal')
      .subscribe({
        next: (wallet) => {
          this.wallets.update((list) => [...list, wallet]);
          if (!this.accountWalletId) {
            this.accountWalletId = wallet.id;
          }
          this.message.set(this.i18n.translate('accounts.walletCreated'));
          this.walletDialogVisible.set(false);
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            err.error?.message ??
              this.i18n.translate('accounts.walletCreateFailed'),
          );
        },
      });
  }

  createAccount() {
    this.error.set(null);
    this.message.set(null);
    if (!this.accountWalletId) {
      this.error.set(this.i18n.translate('accounts.needWallet'));
      return;
    }
    if (!/^-?\d+$/.test(this.openingBalanceMinor.trim())) {
      this.error.set(this.i18n.translate('accounts.invalidOpening'));
      return;
    }
    this.walletsApi
      .createAccount({
        walletId: this.accountWalletId,
        name: this.accountName.trim(),
        currency: this.accountCurrency,
        openingBalanceMinor: this.openingBalanceMinor.trim(),
        isShared: this.isShared,
      })
      .subscribe({
        next: (account) => {
          this.accounts.update((list) => [...list, account]);
          this.message.set(this.i18n.translate('accounts.accountCreated'));
          this.accountDialogVisible.set(false);
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            err.error?.message ??
              this.i18n.translate('accounts.accountCreateFailed'),
          );
        },
      });
  }

  accountsFor(walletId: string): PublicAccount[] {
    return this.accountsByWallet().get(walletId) ?? [];
  }

  externalAccounts(): PublicAccount[] {
    const owned = new Set(this.wallets().map((w) => w.id));
    return this.accounts().filter((a) => !owned.has(a.walletId));
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

  formatOpening(account: PublicAccount): string {
    return formatBalanceMinor(
      account.openingBalanceMinor,
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
}
