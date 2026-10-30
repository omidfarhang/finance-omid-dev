import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PublicAccount, PublicWallet } from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { forkJoin } from 'rxjs';
import { formatBalanceMinor } from '../../core/money-display';
import { WalletsService } from '../../core/wallets.service';

type CurrencyGroup = {
  currency: string;
  accounts: Array<{
    account: PublicAccount;
    walletName: string;
  }>;
};

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, ButtonDirective, Message, TranslocoDirective],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  wallets = signal<PublicWallet[]>([]);
  accounts = signal<PublicAccount[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showToman = signal(false);

  readonly currencyGroups = computed((): CurrencyGroup[] => {
    const walletsById = new Map(this.wallets().map((w) => [w.id, w]));
    const byCurrency = new Map<string, CurrencyGroup['accounts']>();
    for (const account of this.accounts()) {
      const list = byCurrency.get(account.currency) ?? [];
      list.push({
        account,
        walletName: walletsById.get(account.walletId)?.name ?? '—',
      });
      byCurrency.set(account.currency, list);
    }
    return [...byCurrency.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([currency, accounts]) => ({ currency, accounts }));
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

  formatBalance(account: PublicAccount): string {
    return formatBalanceMinor(account.balanceMinor, account.currency, this.showToman(), {
      toman: this.i18n.translate('accounts.toman'),
      rials: this.i18n.translate('accounts.rials'),
      cents: this.i18n.translate('accounts.cents'),
    });
  }

  currencySubtotal(group: CurrencyGroup): string {
    const total = group.accounts.reduce(
      (sum, row) => sum + BigInt(row.account.balanceMinor),
      0n,
    );
    return formatBalanceMinor(total.toString(), group.currency, this.showToman(), {
      toman: this.i18n.translate('accounts.toman'),
      rials: this.i18n.translate('accounts.rials'),
      cents: this.i18n.translate('accounts.cents'),
    });
  }

  toggleToman() {
    this.showToman.update((v) => !v);
  }
}
