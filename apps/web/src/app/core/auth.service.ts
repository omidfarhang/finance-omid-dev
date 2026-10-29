import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import type { PublicUser, RegistrationStatus } from '@finance/shared';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

type AuthResponse = { user: PublicUser };
type TotpChallenge = { requiresTotp: true; pendingToken: string };
type LoginResult = AuthResponse | TotpChallenge;

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<PublicUser | null>(null);
  readonly loaded = signal(false);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  constructor(private readonly http: HttpClient) {}

  registrationStatus(): Observable<RegistrationStatus> {
    return this.http.get<RegistrationStatus>(
      `${environment.apiBaseUrl}/auth/registration-status`,
      { withCredentials: true },
    );
  }

  refreshSession(): Observable<PublicUser | null> {
    return this.http.get<AuthResponse>(`${environment.apiBaseUrl}/auth/me`, {
      withCredentials: true,
    }).pipe(
      map((res) => res.user),
      tap((user) => {
        this.user.set(user);
        this.loaded.set(true);
      }),
      catchError(() => {
        this.user.set(null);
        this.loaded.set(true);
        return of(null);
      }),
    );
  }

  register(payload: {
    email: string;
    password: string;
    displayName: string;
  }): Observable<PublicUser> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, payload, {
        withCredentials: true,
      })
      .pipe(
        map((res) => res.user),
        tap((user) => this.user.set(user)),
      );
  }

  login(payload: {
    email: string;
    password: string;
    code?: string;
  }): Observable<LoginResult> {
    return this.http
      .post<LoginResult>(`${environment.apiBaseUrl}/auth/login`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          if ('user' in res) {
            this.user.set(res.user);
          }
        }),
      );
  }

  completeTotpLogin(payload: {
    pendingToken: string;
    code: string;
  }): Observable<PublicUser> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login/totp`, payload, {
        withCredentials: true,
      })
      .pipe(
        map((res) => res.user),
        tap((user) => this.user.set(user)),
      );
  }

  logout(): Observable<void> {
    return this.http
      .post(`${environment.apiBaseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        map(() => undefined),
        tap(() => this.user.set(null)),
        catchError(() => {
          this.user.set(null);
          return of(undefined);
        }),
      );
  }

  updateProfile(payload: {
    displayName?: string;
    locale?: string | null;
    timeZone?: string | null;
  }): Observable<PublicUser> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/profile`, payload, {
        withCredentials: true,
      })
      .pipe(
        map((res) => res.user),
        tap((user) => this.user.set(user)),
      );
  }

  setup2fa(): Observable<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
    return this.http.post<{
      secret: string;
      otpauthUrl: string;
      qrDataUrl: string;
    }>(`${environment.apiBaseUrl}/auth/2fa/setup`, {}, { withCredentials: true });
  }

  confirm2fa(code: string): Observable<PublicUser> {
    return this.http
      .post<AuthResponse>(
        `${environment.apiBaseUrl}/auth/2fa/confirm`,
        { code },
        { withCredentials: true },
      )
      .pipe(
        map((res) => res.user),
        tap((user) => this.user.set(user)),
      );
  }

  disable2fa(code: string): Observable<PublicUser> {
    return this.http
      .post<AuthResponse>(
        `${environment.apiBaseUrl}/auth/2fa/disable`,
        { code },
        { withCredentials: true },
      )
      .pipe(
        map((res) => res.user),
        tap((user) => this.user.set(user)),
      );
  }
}
