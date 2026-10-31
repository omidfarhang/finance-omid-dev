import { Component, Input } from '@angular/core';

export type AppNavIcon = 'home' | 'activity' | 'accounts' | 'import' | 'outlook';

@Component({
  selector: 'app-nav-icon',
  standalone: true,
  templateUrl: './nav-icon.component.html',
  styleUrl: './nav-icon.component.scss',
})
export class NavIconComponent {
  @Input({ required: true }) name!: AppNavIcon;
}
