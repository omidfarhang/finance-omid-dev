import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { PublicAccount, PublicWallet } from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { forkJoin } from 'rxjs';
import { formatBalanceMinor, minorUnitLabel } from '../../core/money-display';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { WalletsService } from '../../core/wallets.service';

@Component({
  selector: 'app-account-detail-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonDirective,
    Dialog,
    InputText,
    Message,
    TranslocoDirective,
  ],
  templateUrl: './account-detail.page.html',
  styleUrl: './account-detail.page.scss',
})
export class AccountDetailPage implements OnInit {
  account = signal<PublicAccount | null>(null);
  wallet = signal<PublicWallet | null>(null);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  memberDialogVisible = signal(false);
  memberEmail = '';

  private readonly route = inject(ActivatedRoute);
  private readonly walletsApi = inject(WalletsService);
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
    }).subscribe({
      next: ({ wallets, accounts }) => {
        const account = accounts.find((item) => item.id === accountId) ?? null;
        this.account.set(account);
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

  openMemberDialog() {
    this.memberEmail = '';
    this.memberDialogVisible.set(true);
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

  unitLabel(currency: string): string {
    return minorUnitLabel(currency, {
      rials: this.i18n.translate('accounts.rials'),
      cents: this.i18n.translate('accounts.cents'),
    });
  }
}
