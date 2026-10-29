import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { PublicAccount, PublicWallet } from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { forkJoin } from 'rxjs';
import { WalletsService } from '../../core/wallets.service';

const CURRENCIES = ['IRR', 'USD'] as const;

@Component({
  selector: 'app-wallets-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonDirective,
    Checkbox,
    InputText,
    Message,
    TranslocoDirective,
  ],
  templateUrl: './wallets.page.html',
  styleUrl: './wallets.page.scss',
})
export class WalletsPage implements OnInit {
  readonly currencies = CURRENCIES;

  wallets = signal<PublicWallet[]>([]);
  accounts = signal<PublicAccount[]>([]);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  showToman = signal(false);

  walletName = 'Personal';
  accountWalletId = '';
  accountName = '';
  accountCurrency: (typeof CURRENCIES)[number] = 'IRR';
  openingBalanceMinor = '0';
  isShared = false;
  memberEmail = '';
  memberAccountId = '';

  readonly accountsByWallet = computed(() => {
    const map = new Map<string, PublicAccount[]>();
    for (const account of this.accounts()) {
      const list = map.get(account.walletId) ?? [];
      list.push(account);
      map.set(account.walletId, list);
    }
    return map;
  });

  private readonly walletsApi = inject(WalletsService);
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
    }).subscribe({
      next: ({ wallets, accounts }) => {
        this.wallets.set(wallets);
        this.accounts.set(accounts);
        if (!this.accountWalletId && wallets[0]) {
          this.accountWalletId = wallets[0].id;
        }
        const shared = accounts.filter((a) => a.isShared);
        if (!this.memberAccountId && shared[0]) {
          this.memberAccountId = shared[0].id;
        }
        this.loading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(
          err.error?.message ?? this.i18n.translate('wallets.loadFailed'),
        );
      },
    });
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
          this.message.set(this.i18n.translate('wallets.walletCreated'));
          this.walletName = 'Personal';
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            err.error?.message ??
              this.i18n.translate('wallets.walletCreateFailed'),
          );
        },
      });
  }

  createAccount() {
    this.error.set(null);
    this.message.set(null);
    if (!this.accountWalletId) {
      this.error.set(this.i18n.translate('wallets.needWallet'));
      return;
    }
    if (!/^-?\d+$/.test(this.openingBalanceMinor.trim())) {
      this.error.set(this.i18n.translate('wallets.invalidOpening'));
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
          this.message.set(this.i18n.translate('wallets.accountCreated'));
          this.accountName = '';
          this.openingBalanceMinor = '0';
          this.isShared = false;
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            err.error?.message ??
              this.i18n.translate('wallets.accountCreateFailed'),
          );
        },
      });
  }

  addMember() {
    this.error.set(null);
    this.message.set(null);
    if (!this.memberAccountId || !this.memberEmail.trim()) {
      this.error.set(this.i18n.translate('wallets.memberRequired'));
      return;
    }
    this.walletsApi
      .addMember(this.memberAccountId, this.memberEmail.trim())
      .subscribe({
        next: (account) => {
          this.accounts.update((list) =>
            list.map((item) => (item.id === account.id ? account : item)),
          );
          this.message.set(this.i18n.translate('wallets.memberAdded'));
          this.memberEmail = '';
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            err.error?.message ??
              this.i18n.translate('wallets.memberAddFailed'),
          );
        },
      });
  }

  accountsFor(walletId: string): PublicAccount[] {
    return this.accountsByWallet().get(walletId) ?? [];
  }

  /** Accounts the user can access whose home wallet they do not own. */
  externalAccounts(): PublicAccount[] {
    const owned = new Set(this.wallets().map((w) => w.id));
    return this.accounts().filter((a) => !owned.has(a.walletId));
  }

  sharedAccounts(): PublicAccount[] {
    return this.accounts().filter((a) => a.isShared);
  }

  formatBalance(account: PublicAccount): string {
    const minor = BigInt(account.balanceMinor);
    if (account.currency === 'IRR' && this.showToman()) {
      const toman = minor / 10n;
      const rem = minor % 10n;
      const body = rem === 0n ? toman.toString() : `${toman}.${rem.toString()}`;
      return `${body} ${this.i18n.translate('wallets.toman')}`;
    }
    return `${account.balanceMinor} ${this.minorUnitLabel(account.currency)}`;
  }

  minorUnitLabel(currency: string): string {
    if (currency === 'IRR') {
      return this.i18n.translate('wallets.rials');
    }
    if (currency === 'USD') {
      return this.i18n.translate('wallets.cents');
    }
    return currency;
  }

  toggleToman() {
    this.showToman.update((v) => !v);
  }
}
