import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  ImportResult,
  PublicAccount,
  PublicImportAdapter,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { forkJoin } from 'rxjs';
import { ImportsService } from '../../core/imports.service';
import { WalletsService } from '../../core/wallets.service';

@Component({
  selector: 'app-import-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonDirective,
    Message,
    Select,
    TranslocoDirective,
  ],
  templateUrl: './import.page.html',
  styleUrl: './import.page.scss',
})
export class ImportPage implements OnInit {
  accounts = signal<PublicAccount[]>([]);
  adapters = signal<PublicImportAdapter[]>([]);
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  result = signal<ImportResult | null>(null);

  accountId = '';
  adapterId = 'generic_csv';
  selectedFile: File | null = null;

  readonly accountOptions = computed(() =>
    this.accounts().map((a) => ({
      label: `${a.name} (${a.currency})`,
      value: a.id,
    })),
  );

  readonly adapterOptions = computed(() =>
    this.adapters().map((a) => ({ label: a.label, value: a.id })),
  );

  private readonly walletsApi = inject(WalletsService);
  private readonly importsApi = inject(ImportsService);
  private readonly i18n = inject(TranslocoService);

  ngOnInit() {
    this.loading.set(true);
    forkJoin({
      accounts: this.walletsApi.listAccounts(),
      adapters: this.importsApi.listAdapters(),
    }).subscribe({
      next: ({ accounts, adapters }) => {
        this.accounts.set(accounts);
        this.adapters.set(adapters);
        if (accounts[0]) {
          this.accountId = accounts[0].id;
        }
        if (adapters[0]) {
          this.adapterId = adapters[0].id;
        }
        this.loading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(
          err.error?.message ?? this.i18n.translate('importPage.loadFailed'),
        );
      },
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  submit() {
    this.error.set(null);
    this.result.set(null);
    if (!this.accountId || !this.adapterId || !this.selectedFile) {
      this.error.set(this.i18n.translate('importPage.missingFields'));
      return;
    }
    this.submitting.set(true);
    this.importsApi
      .importFile({
        accountId: this.accountId,
        adapterId: this.adapterId,
        file: this.selectedFile,
      })
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.submitting.set(false);
        },
        error: (err: { error?: { message?: string } }) => {
          this.submitting.set(false);
          this.error.set(
            err.error?.message ?? this.i18n.translate('importPage.failed'),
          );
        },
      });
  }
}
