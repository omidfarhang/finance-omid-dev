import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { PrimeNG } from 'primeng/config';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth.service';
import { PRIMENG_LOCALES } from './primeng-locales';
import {
  DEFAULT_UI_LANG,
  SUPPORTED_LANGS,
  UI_LANG_STORAGE_KEY,
  UiLang,
  isUiLang,
  toUiLang,
} from './supported-langs';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  readonly langs = SUPPORTED_LANGS;
  readonly activeLang = signal<UiLang>(DEFAULT_UI_LANG);

  private readonly document = inject(DOCUMENT);
  private readonly transloco = inject(TranslocoService);
  private readonly primeNg = inject(PrimeNG);
  private readonly auth = inject(AuthService);

  /** Resolve preference and load translations before first paint. */
  async init(): Promise<void> {
    let userLocale: string | null = null;
    if (!this.readStoredLang()) {
      const user = await firstValueFrom(this.auth.refreshSession());
      userLocale = user?.locale ?? null;
    }
    await this.applyLang(this.resolvePreferredLang(userLocale), { persistProfile: false });
  }

  resolvePreferredLang(userLocale?: string | null): UiLang {
    const stored = this.readStoredLang();
    if (stored) {
      return stored;
    }

    const fromUser = toUiLang(userLocale);
    if (fromUser) {
      return fromUser;
    }

    const fromBrowser = toUiLang(
      typeof navigator !== 'undefined' ? navigator.language : null,
    );
    if (fromBrowser) {
      return fromBrowser;
    }

    return DEFAULT_UI_LANG;
  }

  async setLang(lang: UiLang, options?: { persistProfile?: boolean }): Promise<void> {
    await this.applyLang(lang, {
      persistProfile: options?.persistProfile ?? true,
    });
  }

  private async applyLang(
    lang: UiLang,
    options: { persistProfile: boolean },
  ): Promise<void> {
    const meta = SUPPORTED_LANGS.find((item) => item.id === lang) ?? SUPPORTED_LANGS[0];

    await firstValueFrom(this.transloco.load(lang));
    this.transloco.setActiveLang(lang);
    this.activeLang.set(lang);

    const root = this.document.documentElement;
    root.lang = lang;
    root.dir = meta.dir;

    this.primeNg.setTranslation(PRIMENG_LOCALES[lang]);
    this.writeStoredLang(lang);

    if (options.persistProfile && this.auth.user()) {
      const current = toUiLang(this.auth.user()?.locale);
      if (current !== lang) {
        await firstValueFrom(this.auth.updateProfile({ locale: lang }));
      }
    }
  }

  private readStoredLang(): UiLang | null {
    try {
      const value = localStorage.getItem(UI_LANG_STORAGE_KEY);
      return isUiLang(value) ? value : null;
    } catch {
      return null;
    }
  }

  private writeStoredLang(lang: UiLang): void {
    try {
      localStorage.setItem(UI_LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore quota / private-mode failures.
    }
  }
}
