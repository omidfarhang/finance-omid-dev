import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type {
  CreateRecurringDto,
  NextMonthForecast,
  PublicRecurring,
  UpdateRecurringDto,
} from '@finance/shared';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecurringsService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<PublicRecurring[]> {
    return this.http
      .get<{ recurrings: PublicRecurring[] }>(
        `${environment.apiBaseUrl}/recurrings`,
        { withCredentials: true },
      )
      .pipe(map((res) => res.recurrings));
  }

  create(payload: CreateRecurringDto): Observable<PublicRecurring> {
    return this.http
      .post<{ recurring: PublicRecurring }>(
        `${environment.apiBaseUrl}/recurrings`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((res) => res.recurring));
  }

  update(
    id: string,
    payload: UpdateRecurringDto,
  ): Observable<PublicRecurring> {
    return this.http
      .patch<{ recurring: PublicRecurring }>(
        `${environment.apiBaseUrl}/recurrings/${id}`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((res) => res.recurring));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/recurrings/${id}`,
      { withCredentials: true },
    );
  }

  nextMonthForecast(): Observable<NextMonthForecast> {
    return this.http.get<NextMonthForecast>(
      `${environment.apiBaseUrl}/forecast/next-month`,
      { withCredentials: true },
    );
  }
}
