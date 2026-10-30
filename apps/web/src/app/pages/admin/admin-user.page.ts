import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { AdminUser, PublicAccount, PublicWallet } from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { forkJoin, of, switchMap } from 'rxjs';
import { formatBalanceMinor } from '../../core/money-display';
import { AdminService } from '../../core/admin.service';

const CURRENCIES = ['IRR', 'USD'] as const;

@Component({
  selector: 'app-admin-user-page',
  standalone: true,
  imports: [
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
  templateUrl: './admin-user.page.html',
  styleUrl: './admin-user.page.scss',
})
export class AdminUserPage implements OnInit {
  readonly currencies = CURRENCIES.map((code) => ({ label: code, value: code }));

  user = signal<AdminUser | null>(null);
  wallets = signal<PublicWallet[]>([]);
  accounts = signal<PublicAccount[]>([]);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  showToman = signal(false);
  walletDialogVisible = signal(false);
  accountDialogVisible = signal(false);

  walletName = 'Personal';
  accountWalletId = '';
  accountName = '';
  accountCurrency: (typeof CURRENCIES)[number] = 'IRR';
  openingBalanceMinor = '0';
  isShared = false;

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

  private readonly route = inject(ActivatedRoute);
  private readonly adminApi = inject(AdminService);
  private readonly i18n = inject(TranslocoService);

  ngOnInit() {
    this.reload();
  }

  reload() {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (!userId) {
      this.error.set(this.i18n.translate('admin.userNotFound'));
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.adminApi
      .listUsers()
      .pipe(
        switchMap((users) => {
          const user = users.find((item) => item.id === userId) ?? null;
          this.user.set(user);
          if (!user) {
            return of({ wallets: [] as PublicWallet[], accounts: [] as PublicAccount[] });
          }
          return forkJoin({
            wallets: this.adminApi.listUserWallets(userId),
            accounts: this.adminApi.listUserAccounts(userId),
          });
        }),
      )
      .subscribe({
        next: ({ wallets, accounts }) => {
          this.wallets.set(wallets);
          this.accounts.set(accounts);
          this.accountWalletId = wallets[0]?.id ?? '';
          if (!this.user()) {
            this.error.set(this.i18n.translate('admin.userNotFound'));
          }
          this.loading.set(false);
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.error.set(
            err.error?.message ?? this.i18n.translate('admin.moneyLoadFailed'),
          );
        },
      });
  }

  openWalletDialog() {
    this.walletName = 'Personal';
    this.walletDialogVisible.set(true);
  }

  openAccountDialog() {
    if (!this.accountWalletId && this.wallets()[0]) {
      this.accountWalletId = this.wallets()[0].id;
    }
    this.accountName = '';
    this.accountCurrency = 'IRR';
    this.openingBalanceMinor = '0';
    this.isShared = false;
    this.accountDialogVisible.set(true);
  }

  createWallet() {
    const userId = this.user()?.id;
    if (!userId) return;
    this.error.set(null);
    this.message.set(null);
    this.adminApi
      .createUserWallet(userId, this.walletName.trim() || 'Personal')
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
    const userId = this.user()?.id;
    if (!userId) return;
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
    this.adminApi
      .createUserAccount(userId, {
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

  formatBalance(account: PublicAccount): string {
    return formatBalanceMinor(account.balanceMinor, account.currency, this.showToman(), {
      toman: this.i18n.translate('accounts.toman'),
      rials: this.i18n.translate('accounts.rials'),
      cents: this.i18n.translate('accounts.cents'),
    });
  }

  toggleToman() {
    this.showToman.update((v) => !v);
  }
}
