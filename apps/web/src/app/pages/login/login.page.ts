import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Message } from 'primeng/message';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink, Button, InputText, Password, Message, TranslocoDirective],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  email = '';
  password = '';
  totpCode = '';
  pendingToken = signal<string | null>(null);
  error = signal<string | null>(null);
  loading = signal(false);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslocoService);

  submit() {
    this.error.set(null);
    this.loading.set(true);

    const pending = this.pendingToken();
    if (pending) {
      this.auth.completeTotpLogin({ pendingToken: pending, code: this.totpCode }).subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigateByUrl('/profile');
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? this.i18n.translate('errors.invalidAuthCode'));
        },
      });
      return;
    }

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if ('requiresTotp' in res && res.requiresTotp) {
          this.pendingToken.set(res.pendingToken);
          return;
        }
        void this.router.navigateByUrl('/profile');
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? this.i18n.translate('errors.loginFailed'));
      },
    });
  }
}
