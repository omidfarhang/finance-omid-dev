import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { AuthService } from '../../core/auth.service';
import { LocaleService } from '../../core/i18n/locale.service';
import { UiLang, toUiLang } from '../../core/i18n/supported-langs';
import {
  ensureTimeZoneOption,
  listTimeZones,
} from '../../core/i18n/time-zones';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonDirective,
    InputText,
    Message,
    TranslocoDirective,
  ],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage implements OnInit {
  displayName = '';
  timeZone = '';
  totpCode = '';
  disableCode = '';
  timeZones: string[] = listTimeZones();
  qrDataUrl = signal<string | null>(null);
  totpSecret = signal<string | null>(null);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  loading = signal(false);

  readonly auth = inject(AuthService);
  readonly localeService = inject(LocaleService);
  readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslocoService);

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      this.displayName = user.displayName;
      this.timeZone = user.timeZone ?? '';
      this.timeZones = ensureTimeZoneOption(this.timeZones, user.timeZone);
      const fromProfile = toUiLang(user.locale);
      if (fromProfile && fromProfile !== this.localeService.activeLang()) {
        void this.localeService.setLang(fromProfile, { persistProfile: false });
      }
    }
  }

  onLocaleChange(lang: UiLang) {
    void this.localeService.setLang(lang, { persistProfile: false });
  }

  onShowTomanChange(checked: boolean) {
    this.moneyDisplay.setShowToman(checked);
  }

  saveProfile() {
    this.error.set(null);
    this.message.set(null);
    this.loading.set(true);
    const locale = this.localeService.activeLang();
    this.auth
      .updateProfile({
        displayName: this.displayName,
        locale,
        timeZone: this.timeZone || null,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          void this.localeService.setLang(locale, { persistProfile: false });
          this.message.set(this.i18n.translate('settings.updated'));
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.error.set(
            err.error?.message ?? this.i18n.translate('settings.updateFailed'),
          );
        },
      });
  }

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

  logout() {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
    });
  }
}
