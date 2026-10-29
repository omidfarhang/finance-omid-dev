import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { environment } from '../../../environments/environment';

type HealthResponse = { status: string };

@Component({
  selector: 'app-status-page',
  standalone: true,
  imports: [RouterLink, Button, Message],
  templateUrl: './status.page.html',
  styleUrl: './status.page.scss',
})
export class StatusPage implements OnInit {
  readonly loading = signal(false);
  readonly ok = signal<boolean | null>(null);
  readonly detail = signal<string | null>(null);

  constructor(private readonly http: HttpClient) {}

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
        this.detail.set(healthy ? 'API reported status ok.' : `Unexpected status: ${res.status}`);
      },
      error: (err: { status?: number; message?: string }) => {
        this.loading.set(false);
        this.ok.set(false);
        this.detail.set(
          err.status
            ? `API unreachable (HTTP ${err.status}).`
            : (err.message ?? 'API unreachable.'),
        );
      },
    });
  }
}
