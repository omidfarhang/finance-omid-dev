import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { AppNavIcon, NavIconComponent } from '../nav-icon/nav-icon.component';
import { UserMenuComponent } from '../user-menu/user-menu.component';

export interface AppNavItem {
  path: string;
  labelKey: string;
  icon: AppNavIcon;
  exact?: boolean;
}

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ConfirmDialog,
    TranslocoDirective,
    UserMenuComponent,
    NavIconComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  readonly navItems: readonly AppNavItem[] = [
    { path: '/', labelKey: 'app.nav.home', icon: 'home', exact: true },
    { path: '/activity', labelKey: 'app.nav.activity', icon: 'activity' },
    { path: '/accounts', labelKey: 'app.nav.accounts', icon: 'accounts' },
    { path: '/outlook', labelKey: 'app.nav.outlook', icon: 'outlook' },
  ];
}
