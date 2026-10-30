import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LangSwitchComponent } from '../lang-switch/lang-switch.component';

@Component({
  selector: 'app-guest-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TranslocoDirective, LangSwitchComponent],
  templateUrl: './guest-shell.component.html',
  styleUrl: './guest-shell.component.scss',
})
export class GuestShellComponent {}
