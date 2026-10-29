import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { AuthService } from '../../core/auth.service';
import { LocaleService } from '../../core/i18n/locale.service';
import { UiLang, toUiLang } from '../../core/i18n/supported-langs';
import { ensureTimeZoneOption, listTimeZones } from '../../core/i18n/time-zones';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [FormsModule, Button, InputText, Message, TranslocoDirective],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit {
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
          this.message.set(this.i18n.translate('profile.updated'));
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? this.i18n.translate('profile.updateFailed'));
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
        this.error.set(err.error?.message ?? this.i18n.translate('profile.totp.setupFailed'));
      },
    });
  }

  confirm2fa() {
    this.error.set(null);
    this.auth.confirm2fa(this.totpCode).subscribe({
      next: () => {
        this.message.set(this.i18n.translate('profile.totp.enabledMessage'));
        this.qrDataUrl.set(null);
        this.totpSecret.set(null);
        this.totpCode = '';
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err.error?.message ?? this.i18n.translate('profile.totp.invalidCode'));
      },
    });
  }

  disable2fa() {
    this.error.set(null);
    this.auth.disable2fa(this.disableCode).subscribe({
      next: () => {
        this.message.set(this.i18n.translate('profile.totp.disabledMessage'));
        this.disableCode = '';
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err.error?.message ?? this.i18n.translate('profile.totp.disableFailed'));
      },
    });
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
    });
  }
}
