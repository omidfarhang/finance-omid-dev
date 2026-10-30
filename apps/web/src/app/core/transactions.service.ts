import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type {
  CreateTransactionDto,
  PublicCategory,
  PublicTransaction,
} from '@finance/shared';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type ListTransactionsParams = {
  accountId?: string;
  from?: string;
  to?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
};

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  constructor(private readonly http: HttpClient) {}

  listTransactions(
    params: ListTransactionsParams = {},
  ): Observable<PublicTransaction[]> {
    let httpParams = new HttpParams();
    if (params.accountId) {
      httpParams = httpParams.set('accountId', params.accountId);
    }
    if (params.from) {
      httpParams = httpParams.set('from', params.from);
    }
    if (params.to) {
      httpParams = httpParams.set('to', params.to);
    }
    if (params.type) {
      httpParams = httpParams.set('type', params.type);
    }
    return this.http
      .get<{ transactions: PublicTransaction[] }>(
        `${environment.apiBaseUrl}/transactions`,
        { withCredentials: true, params: httpParams },
      )
      .pipe(map((res) => res.transactions));
  }

  createTransaction(
    payload: CreateTransactionDto,
  ): Observable<PublicTransaction> {
    return this.http
      .post<{ transaction: PublicTransaction }>(
        `${environment.apiBaseUrl}/transactions`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((res) => res.transaction));
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/transactions/${id}`,
      { withCredentials: true },
    );
  }

  listCategories(): Observable<PublicCategory[]> {
    return this.http
      .get<{ categories: PublicCategory[] }>(
        `${environment.apiBaseUrl}/categories`,
        { withCredentials: true },
      )
      .pipe(map((res) => res.categories));
  }

  createCategory(name: string): Observable<PublicCategory> {
    return this.http
      .post<{ category: PublicCategory }>(
        `${environment.apiBaseUrl}/categories`,
        { name },
        { withCredentials: true },
      )
      .pipe(map((res) => res.category));
  }
}
