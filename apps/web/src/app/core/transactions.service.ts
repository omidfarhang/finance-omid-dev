import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type {
  CategoryKind,
  CreateCategoryDto,
  CreateTransactionDto,
  PublicCategory,
  PublicTransaction,
  UpdateCategoryDto,
  UpdateTransactionDto,
} from '@finance/shared';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type ListTransactionsParams = {
  accountId?: string;
  from?: string;
  to?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: string;
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
    if (params.categoryId) {
      httpParams = httpParams.set('categoryId', params.categoryId);
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

  updateTransaction(
    id: string,
    payload: UpdateTransactionDto,
  ): Observable<PublicTransaction> {
    return this.http
      .patch<{ transaction: PublicTransaction }>(
        `${environment.apiBaseUrl}/transactions/${id}`,
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

  listCategories(kind?: CategoryKind): Observable<PublicCategory[]> {
    let httpParams = new HttpParams();
    if (kind) {
      httpParams = httpParams.set('kind', kind);
    }
    return this.http
      .get<{ categories: PublicCategory[] }>(
        `${environment.apiBaseUrl}/categories`,
        { withCredentials: true, params: httpParams },
      )
      .pipe(map((res) => res.categories));
  }

  createCategory(payload: CreateCategoryDto): Observable<PublicCategory> {
    return this.http
      .post<{ category: PublicCategory }>(
        `${environment.apiBaseUrl}/categories`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((res) => res.category));
  }

  updateCategory(
    id: string,
    payload: UpdateCategoryDto,
  ): Observable<PublicCategory> {
    return this.http
      .patch<{ category: PublicCategory }>(
        `${environment.apiBaseUrl}/categories/${id}`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((res) => res.category));
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/categories/${id}`,
      { withCredentials: true },
    );
  }
}
