import {
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  ImportResult,
  PublicAccount,
  PublicImportAdapter,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { ImportsService } from '../../core/imports.service';

@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ButtonDirective,
    Dialog,
    Message,
    Select,
    TranslocoDirective,
  ],
  templateUrl: './import-dialog.component.html',
  styleUrl: './import-dialog.component.scss',
})
export class ImportDialogComponent {
  readonly visible = model(false);
  readonly accounts = input.required<PublicAccount[]>();
  /** When set (account detail), account is fixed and the picker is hidden. */
  readonly fixedAccountId = input<string | null>(null);

  readonly imported = output<ImportResult>();

  adapters = signal<PublicImportAdapter[]>([]);
  loadingAdapters = signal(false);
  submitting = signal(false);
  formError = signal<string | null>(null);
  result = signal<ImportResult | null>(null);

  accountId = '';
  adapterId = signal<string>('generic_csv');
  selectedFile: File | null = null;
  /** Remounts the file input when the adapter changes so the browser clears the path. */
  fileInputKey = signal(0);

  readonly accountLocked = computed(() => Boolean(this.fixedAccountId()));

  readonly accountOptions = computed(() =>
    this.accounts().map((a) => ({
      label: `${a.name} (${a.currency})`,
      value: a.id,
    })),
  );

  readonly adapterOptions = computed(() =>
    this.adapters().map((a) => ({ label: a.label, value: a.id })),
  );

  readonly selectedAdapter = computed(() =>
    this.adapters().find((a) => a.id === this.adapterId()),
  );

  readonly sampleDownloadName = computed(() => {
    const path = this.selectedAdapter()?.samplePath ?? '';
    const fromPath = path.split('/').pop();
    if (fromPath) {
      return fromPath;
    }
    const id = this.adapterId();
    return id ? `${id}-sample` : 'sample';
  });

  readonly fileAccept = computed(() => {
    const path = this.selectedAdapter()?.samplePath ?? '';
    if (path.endsWith('.xlsx')) {
      return '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
    if (path.endsWith('.csv')) {
      return '.csv,text/csv';
    }
    return '.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  });

  private readonly importsApi = inject(ImportsService);
  private readonly i18n = inject(TranslocoService);

  constructor() {
    effect(() => {
      if (this.visible()) {
        untracked(() => {
          this.resetForm();
          this.loadAdapters();
        });
      }
    });
  }

  onAdapterChange(adapterId: string) {
    this.adapterId.set(adapterId);
    this.selectedFile = null;
    this.fileInputKey.update((n) => n + 1);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  close() {
    this.visible.set(false);
  }

  submit() {
    this.formError.set(null);
    this.result.set(null);
    const accountId = this.fixedAccountId() ?? this.accountId;
    const adapterId = this.adapterId();
    if (!accountId || !adapterId || !this.selectedFile) {
      this.formError.set(this.i18n.translate('importPage.missingFields'));
      return;
    }
    this.submitting.set(true);
    this.importsApi
      .importFile({
        accountId,
        adapterId,
        file: this.selectedFile,
      })
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.submitting.set(false);
          this.imported.emit(result);
        },
        error: (err: { error?: { message?: string } }) => {
          this.submitting.set(false);
          this.formError.set(
            err.error?.message ?? this.i18n.translate('importPage.failed'),
          );
        },
      });
  }

  private resetForm() {
    const fixed = this.fixedAccountId();
    this.accountId = fixed ?? this.accounts()[0]?.id ?? '';
    this.adapterId.set(this.adapters()[0]?.id ?? 'generic_csv');
    this.selectedFile = null;
    this.formError.set(null);
    this.result.set(null);
    this.submitting.set(false);
  }

  private loadAdapters() {
    this.loadingAdapters.set(true);
    this.importsApi.listAdapters().subscribe({
      next: (adapters) => {
        this.adapters.set(adapters);
        if (adapters[0]) {
          this.adapterId.set(adapters[0].id);
        }
        this.loadingAdapters.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loadingAdapters.set(false);
        this.formError.set(
          err.error?.message ?? this.i18n.translate('importPage.loadFailed'),
        );
      },
    });
  }
}
