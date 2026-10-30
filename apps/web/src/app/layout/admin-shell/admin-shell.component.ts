import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    TranslocoDirective,
    UserMenuComponent,
    ConfirmDialog,
  ],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {}
