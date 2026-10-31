import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-settings-security-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    Message,
    TranslocoDirective,
  ],
  templateUrl: './settings-security.page.html',
  styleUrl: './settings-security.page.scss',
})
export class SettingsSecurityPage {
  totpCode = '';
  disableCode = '';
  qrDataUrl = signal<string | null>(null);
  totpSecret = signal<string | null>(null);
  message = signal<string | null>(null);
  error = signal<string | null>(null);

  readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslocoService);

  start2fa() {
    this.error.set(null);
    this.auth.setup2fa().subscribe({
      next: (res) => {
        this.qrDataUrl.set(res.qrDataUrl);
        this.totpSecret.set(res.secret);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('settings.totp.setupFailed'),
        );
      },
    });
  }

  confirm2fa() {
    this.error.set(null);
    this.auth.confirm2fa(this.totpCode).subscribe({
      next: () => {
        this.message.set(this.i18n.translate('settings.totp.enabledMessage'));
        this.qrDataUrl.set(null);
        this.totpSecret.set(null);
        this.totpCode = '';
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('settings.totp.invalidCode'),
        );
      },
    });
  }

  disable2fa() {
    this.error.set(null);
    this.auth.disable2fa(this.disableCode).subscribe({
      next: () => {
        this.message.set(this.i18n.translate('settings.totp.disabledMessage'));
        this.disableCode = '';
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ??
            this.i18n.translate('settings.totp.disableFailed'),
        );
      },
    });
  }
}
