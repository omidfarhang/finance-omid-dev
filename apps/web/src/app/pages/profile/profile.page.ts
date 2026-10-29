import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [FormsModule, Button, InputText, Message],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit {
  displayName = '';
  locale = '';
  timeZone = '';
  totpCode = '';
  disableCode = '';
  qrDataUrl = signal<string | null>(null);
  totpSecret = signal<string | null>(null);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  loading = signal(false);

  constructor(
    readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      this.displayName = user.displayName;
      this.locale = user.locale ?? '';
      this.timeZone = user.timeZone ?? '';
    }
  }

  saveProfile() {
    this.error.set(null);
    this.message.set(null);
    this.loading.set(true);
    this.auth
      .updateProfile({
        displayName: this.displayName,
        locale: this.locale || null,
        timeZone: this.timeZone || null,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.message.set('Profile updated');
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? 'Could not update profile');
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
        this.error.set(err.error?.message ?? 'Could not start 2FA setup');
      },
    });
  }

  confirm2fa() {
    this.error.set(null);
    this.auth.confirm2fa(this.totpCode).subscribe({
      next: () => {
        this.message.set('Two-factor authentication enabled');
        this.qrDataUrl.set(null);
        this.totpSecret.set(null);
        this.totpCode = '';
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err.error?.message ?? 'Invalid authentication code');
      },
    });
  }

  disable2fa() {
    this.error.set(null);
    this.auth.disable2fa(this.disableCode).subscribe({
      next: () => {
        this.message.set('Two-factor authentication disabled');
        this.disableCode = '';
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err.error?.message ?? 'Could not disable 2FA');
      },
    });
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
    });
  }
}
