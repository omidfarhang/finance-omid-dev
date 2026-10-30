import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LocaleService } from '../../core/i18n/locale.service';
import { UiLang } from '../../core/i18n/supported-langs';

@Component({
  selector: 'app-lang-switch',
  standalone: true,
  imports: [TranslocoDirective],
  template: `
    <label class="lang-switch" *transloco="let t">
      <span class="visually-hidden">{{ t('app.language') }}</span>
      <select
        [attr.aria-label]="t('app.language')"
        [value]="locale.activeLang()"
        (change)="onLangChange($event)"
      >
        @for (lang of locale.langs; track lang.id) {
          <option [value]="lang.id">{{ t(lang.labelKey) }}</option>
        }
      </select>
    </label>
  `,
  styles: `
    .lang-switch select {
      font: inherit;
      font-weight: 600;
      color: inherit;
      background: transparent;
      border: 1px solid color-mix(in srgb, var(--app-text) 16%, transparent);
      border-radius: 0.4rem;
      padding: 0.35rem 0.55rem;
      cursor: pointer;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class LangSwitchComponent {
  readonly locale = inject(LocaleService);

  onLangChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    void this.locale.setLang(value as UiLang);
  }
}
