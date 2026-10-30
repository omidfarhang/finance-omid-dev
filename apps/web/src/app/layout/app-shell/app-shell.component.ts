import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { AuthService } from '../../core/auth.service';
import { LangSwitchComponent } from '../lang-switch/lang-switch.component';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslocoDirective,
    LangSwitchComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly overflowOpen = signal(false);

  toggleOverflow(event: Event) {
    event.stopPropagation();
    this.overflowOpen.update((v) => !v);
  }

  closeOverflow() {
    this.overflowOpen.set(false);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeOverflow();
  }
}
