import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Message } from 'primeng/message';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonDirective,
    InputText,
    Password,
    Message,
    TranslocoDirective,
  ],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage implements OnInit {
  email = '';
  password = '';
  displayName = '';
  error = signal<string | null>(null);
  loading = signal(false);
  statusLoading = signal(true);
  registrationAllowed = signal(true);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslocoService);

  ngOnInit() {
    this.auth.registrationStatus().subscribe({
      next: (status) => {
        this.registrationAllowed.set(status.open || status.bootstrapAllowed);
        this.statusLoading.set(false);
      },
      error: () => {
        this.registrationAllowed.set(false);
        this.statusLoading.set(false);
        this.error.set(this.i18n.translate('register.statusFailed'));
      },
    });
  }

  submit() {
    if (!this.registrationAllowed()) return;
    this.error.set(null);
    this.loading.set(true);
    this.auth
      .register({
        email: this.email,
        password: this.password,
        displayName: this.displayName,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigateByUrl('/');
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.error.set(
            err.error?.message ??
              this.i18n.translate('errors.registrationFailed'),
          );
        },
      });
  }
}
