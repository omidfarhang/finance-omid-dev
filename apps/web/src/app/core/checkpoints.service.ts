import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { PublicCheckpoint } from '@finance/shared';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CheckpointsService {
  constructor(private readonly http: HttpClient) {}

  listForAccount(accountId: string): Observable<PublicCheckpoint[]> {
    return this.http
      .get<{ checkpoints: PublicCheckpoint[] }>(
        `${environment.apiBaseUrl}/accounts/${accountId}/checkpoints`,
        { withCredentials: true },
      )
      .pipe(map((res) => res.checkpoints));
  }

  list(opts?: {
    accountId?: string;
    from?: string;
    to?: string;
  }): Observable<PublicCheckpoint[]> {
    let params = new HttpParams();
    if (opts?.accountId) {
      params = params.set('accountId', opts.accountId);
    }
    if (opts?.from) {
      params = params.set('from', opts.from);
    }
    if (opts?.to) {
      params = params.set('to', opts.to);
    }
    return this.http
      .get<{ checkpoints: PublicCheckpoint[] }>(
        `${environment.apiBaseUrl}/checkpoints`,
        { withCredentials: true, params },
      )
      .pipe(map((res) => res.checkpoints));
  }

  create(
    accountId: string,
    payload: { asOf: string; balanceMinor: string; note?: string | null },
  ): Observable<PublicCheckpoint> {
    return this.http
      .post<{ checkpoint: PublicCheckpoint }>(
        `${environment.apiBaseUrl}/accounts/${accountId}/checkpoints`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((res) => res.checkpoint));
  }

  update(
    checkpointId: string,
    payload: {
      asOf?: string;
      balanceMinor?: string;
      note?: string | null;
    },
  ): Observable<PublicCheckpoint> {
    return this.http
      .patch<{ checkpoint: PublicCheckpoint }>(
        `${environment.apiBaseUrl}/checkpoints/${checkpointId}`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((res) => res.checkpoint));
  }

  remove(checkpointId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/checkpoints/${checkpointId}`,
      { withCredentials: true },
    );
  }
}
