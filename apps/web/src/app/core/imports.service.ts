import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { ImportResult, PublicImportAdapter } from '@finance/shared';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImportsService {
  constructor(private readonly http: HttpClient) {}

  listAdapters(): Observable<PublicImportAdapter[]> {
    return this.http
      .get<{ adapters: PublicImportAdapter[] }>(
        `${environment.apiBaseUrl}/imports/adapters`,
        { withCredentials: true },
      )
      .pipe(map((res) => res.adapters));
  }

  importFile(input: {
    accountId: string;
    adapterId: string;
    file: File;
  }): Observable<ImportResult> {
    const form = new FormData();
    form.append('accountId', input.accountId);
    form.append('adapterId', input.adapterId);
    form.append('file', input.file, input.file.name);
    return this.http.post<ImportResult>(
      `${environment.apiBaseUrl}/imports`,
      form,
      { withCredentials: true },
    );
  }
}
