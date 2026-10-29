import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AdminUser, PublicAccount, PublicWallet } from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';

const CURRENCIES = ['IRR', 'USD'] as const;

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonDirective,
    Checkbox,
    InputText,
    Message,
    TranslocoDirective,
  ],
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.scss',
})
export class AdminPage implements OnInit {
  readonly currencies = CURRENCIES;

  users = signal<AdminUser[]>([]);
  registrationOpen = signal(true);
  selectedUserId = signal<string | null>(null);
  wallets = signal<PublicWallet[]>([]);
  accounts = signal<PublicAccount[]>([]);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);

  walletName = 'Personal';
  accountWalletId = '';
  accountName = '';
  accountCurrency: (typeof CURRENCIES)[number] = 'IRR';
  openingBalanceMinor = '0';
  isShared = false;

  readonly selectedUser = computed(() => {
    const id = this.selectedUserId();
    return this.users().find((user) => user.id === id) ?? null;
  });

  readonly accountsByWallet = computed(() => {
    const map = new Map<string, PublicAccount[]>();
    for (const account of this.accounts()) {
      const list = map.get(account.walletId) ?? [];
      list.push(account);
      map.set(account.walletId, list);
    }
    return map;
  });

  private readonly adminApi = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslocoService);

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      settings: this.adminApi.getSettings(),
      users: this.adminApi.listUsers(),
    }).subscribe({
      next: ({ settings, users }) => {
        this.registrationOpen.set(settings.registrationOpen);
        this.users.set(users);
        this.loading.set(false);
        const selected = this.selectedUserId();
        if (selected && users.some((user) => user.id === selected)) {
          this.loadUserMoney(selected);
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(
          err.error?.message ?? this.i18n.translate('admin.loadFailed'),
        );
      },
    });
  }

  toggleRegistration() {
    this.error.set(null);
    this.message.set(null);
    const next = !this.registrationOpen();
    this.adminApi.updateSettings({ registrationOpen: next }).subscribe({
      next: (settings) => {
        this.registrationOpen.set(settings.registrationOpen);
        this.message.set(
          settings.registrationOpen
            ? this.i18n.translate('admin.registrationOpened')
            : this.i18n.translate('admin.registrationClosed'),
        );
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('admin.settingsFailed'),
        );
      },
    });
  }

  selectUser(userId: string) {
    this.selectedUserId.set(userId);
    this.loadUserMoney(userId);
  }

  clearSelection() {
    this.selectedUserId.set(null);
    this.wallets.set([]);
    this.accounts.set([]);
  }

  setRole(user: AdminUser, role: 'USER' | 'ADMIN') {
    this.patchUser(user.id, { role });
  }

  setDisabled(user: AdminUser, disabled: boolean) {
    this.patchUser(user.id, { disabled });
  }

  deleteUser(user: AdminUser) {
    const confirmed = window.confirm(
      this.i18n.translate('admin.confirmDelete', { email: user.email }),
    );
    if (!confirmed) return;

    this.error.set(null);
    this.message.set(null);
    this.adminApi.deleteUser(user.id).subscribe({
      next: () => {
        this.message.set(this.i18n.translate('admin.userDeleted'));
        if (this.selectedUserId() === user.id) {
          this.clearSelection();
        }
        this.reload();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('admin.deleteFailed'),
        );
      },
    });
  }

  createWallet() {
    const userId = this.selectedUserId();
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
    const userId = this.selectedUserId();
    if (!userId) return;
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

  accountsFor(walletId: string): PublicAccount[] {
    return this.accountsByWallet().get(walletId) ?? [];
  }

  isSelf(user: AdminUser): boolean {
    return user.id === this.auth.user()?.id;
  }

  private patchUser(
    userId: string,
    payload: { role?: 'USER' | 'ADMIN'; disabled?: boolean },
  ) {
    this.error.set(null);
    this.message.set(null);
    this.adminApi.updateUser(userId, payload).subscribe({
      next: (user) => {
        this.users.update((list) =>
          list.map((item) => (item.id === user.id ? user : item)),
        );
        this.message.set(this.i18n.translate('admin.userUpdated'));
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('admin.updateFailed'),
        );
      },
    });
  }

  private loadUserMoney(userId: string) {
    forkJoin({
      wallets: this.adminApi.listUserWallets(userId),
      accounts: this.adminApi.listUserAccounts(userId),
    }).subscribe({
      next: ({ wallets, accounts }) => {
        this.wallets.set(wallets);
        this.accounts.set(accounts);
        this.accountWalletId = wallets[0]?.id ?? '';
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('admin.moneyLoadFailed'),
        );
      },
    });
  }
}
