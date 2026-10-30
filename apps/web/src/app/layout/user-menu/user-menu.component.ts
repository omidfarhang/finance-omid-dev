import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [RouterLink, TranslocoDirective],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
})
export class UserMenuComponent {
  readonly auth = inject(AuthService);
  readonly open = signal(false);
  private readonly router = inject(Router);

  toggle(event: Event) {
    event.stopPropagation();
    this.open.update((v) => !v);
  }

  close() {
    this.open.set(false);
  }

  logout() {
    this.close();
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
    });
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.close();
  }
}
