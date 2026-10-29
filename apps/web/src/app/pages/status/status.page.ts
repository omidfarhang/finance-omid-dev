import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { environment } from '../../../environments/environment';

type HealthResponse = { status: string };

@Component({
  selector: 'app-status-page',
  standalone: true,
  imports: [RouterLink, Button, Message, TranslocoDirective],
  templateUrl: './status.page.html',
  styleUrl: './status.page.scss',
})
export class StatusPage implements OnInit {
  readonly loading = signal(false);
  readonly ok = signal<boolean | null>(null);
  readonly detail = signal<string | null>(null);

  private readonly http = inject(HttpClient);
  private readonly i18n = inject(TranslocoService);

  ngOnInit() {
    this.check();
  }

  check() {
    this.loading.set(true);
    this.ok.set(null);
    this.detail.set(null);

    this.http.get<HealthResponse>(`${environment.apiBaseUrl}/health`).subscribe({
      next: (res) => {
        this.loading.set(false);
        const healthy = res.status === 'ok';
        this.ok.set(healthy);
        this.detail.set(
          healthy
            ? this.i18n.translate('status.ok')
            : this.i18n.translate('status.unexpected', { status: res.status }),
        );
      },
      error: (err: { status?: number; message?: string }) => {
        this.loading.set(false);
        this.ok.set(false);
        this.detail.set(
          err.status
            ? this.i18n.translate('status.unreachableHttp', { status: err.status })
            : this.i18n.translate('status.unreachable'),
        );
      },
    });
  }
}
