import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { AuthService } from './core/auth.service';
import { LocaleService } from './core/i18n/locale.service';
import { UiLang } from './core/i18n/supported-langs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, TranslocoDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly locale = inject(LocaleService);

  onLangChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    void this.locale.setLang(value as UiLang);
  }
}
