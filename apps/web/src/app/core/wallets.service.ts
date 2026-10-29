import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { PublicAccount, PublicWallet } from '@finance/shared';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WalletsService {
  constructor(private readonly http: HttpClient) {}

  listWallets(): Observable<PublicWallet[]> {
    return this.http
      .get<{ wallets: PublicWallet[] }>(`${environment.apiBaseUrl}/wallets`, {
        withCredentials: true,
      })
      .pipe(map((res) => res.wallets));
  }

  createWallet(name: string): Observable<PublicWallet> {
    return this.http
      .post<{ wallet: PublicWallet }>(
        `${environment.apiBaseUrl}/wallets`,
        { name },
        { withCredentials: true },
      )
      .pipe(map((res) => res.wallet));
  }

  listAccounts(): Observable<PublicAccount[]> {
    return this.http
      .get<{ accounts: PublicAccount[] }>(`${environment.apiBaseUrl}/accounts`, {
        withCredentials: true,
      })
      .pipe(map((res) => res.accounts));
  }

  createAccount(payload: {
    walletId: string;
    name: string;
    currency: string;
    openingBalanceMinor: string;
    isShared: boolean;
  }): Observable<PublicAccount> {
    return this.http
      .post<{ account: PublicAccount }>(
        `${environment.apiBaseUrl}/accounts`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((res) => res.account));
  }

  addMember(accountId: string, email: string): Observable<PublicAccount> {
    return this.http
      .post<{ account: PublicAccount }>(
        `${environment.apiBaseUrl}/accounts/${accountId}/members`,
        { email },
        { withCredentials: true },
      )
      .pipe(map((res) => res.account));
  }
}
