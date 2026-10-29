import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Message } from 'primeng/message';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink, Button, InputText, Password, Message],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  email = '';
  password = '';
  displayName = '';
  error = signal<string | null>(null);
  loading = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  submit() {
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
          void this.router.navigateByUrl('/profile');
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? 'Registration failed');
        },
      });
  }
}
