import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type {
  AdminUser,
  AppSettingsDto,
  PublicAccount,
  PublicWallet,
  UpdateAdminUserDto,
  UpdateAppSettingsDto,
} from '@finance/shared';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly http: HttpClient) {}

  getSettings(): Observable<AppSettingsDto> {
    return this.http
      .get<{ settings: AppSettingsDto }>(
        `${environment.apiBaseUrl}/admin/settings`,
        { withCredentials: true },
      )
      .pipe(map((res) => res.settings));
  }

  updateSettings(payload: UpdateAppSettingsDto): Observable<AppSettingsDto> {
    return this.http
      .patch<{ settings: AppSettingsDto }>(
        `${environment.apiBaseUrl}/admin/settings`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((res) => res.settings));
  }

  listUsers(): Observable<AdminUser[]> {
    return this.http
      .get<{ users: AdminUser[] }>(`${environment.apiBaseUrl}/admin/users`, {
        withCredentials: true,
      })
      .pipe(map((res) => res.users));
  }

  updateUser(userId: string, payload: UpdateAdminUserDto): Observable<AdminUser> {
    return this.http
      .patch<{ user: AdminUser }>(
        `${environment.apiBaseUrl}/admin/users/${userId}`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((res) => res.user));
  }

  deleteUser(userId: string): Observable<void> {
    return this.http
      .delete(`${environment.apiBaseUrl}/admin/users/${userId}`, {
        withCredentials: true,
      })
      .pipe(map(() => undefined));
  }

  listUserWallets(userId: string): Observable<PublicWallet[]> {
    return this.http
      .get<{ wallets: PublicWallet[] }>(
        `${environment.apiBaseUrl}/admin/users/${userId}/wallets`,
        { withCredentials: true },
      )
      .pipe(map((res) => res.wallets));
  }

  createUserWallet(userId: string, name: string): Observable<PublicWallet> {
    return this.http
      .post<{ wallet: PublicWallet }>(
        `${environment.apiBaseUrl}/admin/users/${userId}/wallets`,
        { name },
        { withCredentials: true },
      )
      .pipe(map((res) => res.wallet));
  }

  listUserAccounts(userId: string): Observable<PublicAccount[]> {
    return this.http
      .get<{ accounts: PublicAccount[] }>(
        `${environment.apiBaseUrl}/admin/users/${userId}/accounts`,
        { withCredentials: true },
      )
      .pipe(map((res) => res.accounts));
  }

  createUserAccount(
    userId: string,
    payload: {
      walletId: string;
      name: string;
      currency: string;
      initialBalanceMinor: string;
      initialBalanceAsOf: string;
      isShared: boolean;
    },
  ): Observable<PublicAccount> {
    return this.http
      .post<{ account: PublicAccount }>(
        `${environment.apiBaseUrl}/admin/users/${userId}/accounts`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((res) => res.account));
  }
}
