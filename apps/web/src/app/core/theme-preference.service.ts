import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import {
  DEFAULT_THEME,
  type PublicUser,
  type ThemePreference,
} from '@finance/shared';

/** localStorage key for theme preference cache. */
export const THEME_STORAGE_KEY = 'finance.theme';

const DARK_CLASS = 'app-dark';

function isThemePreference(
  value: string | null | undefined,
): value is ThemePreference {
  return value === 'LIGHT' || value === 'DARK' || value === 'SYSTEM';
}

@Injectable({ providedIn: 'root' })
export class ThemePreferenceService {
  readonly theme = signal<ThemePreference>(this.readStored() ?? DEFAULT_THEME);

  private readonly document = inject(DOCUMENT);
  private mediaQuery: MediaQueryList | null = null;
  private readonly onMediaChange = () => this.applyResolved();

  /** Apply stored preference to the document (call on app init). */
  init(): void {
    this.applyResolved();
    this.syncMediaListener();
  }

  hydrateFromUser(user: PublicUser | null): void {
    if (!user || !isThemePreference(user.theme)) {
      return;
    }
    this.setTheme(user.theme);
  }

  setTheme(value: ThemePreference): void {
    this.theme.set(value);
    this.writeStored(value);
    this.applyResolved();
    this.syncMediaListener();
  }

  isDarkResolved(): boolean {
    const preference = this.theme();
    if (preference === 'DARK') {
      return true;
    }
    if (preference === 'LIGHT') {
      return false;
    }
    return this.systemPrefersDark();
  }

  private applyResolved(): void {
    const root = this.document.documentElement;
    const dark = this.isDarkResolved();
    root.classList.toggle(DARK_CLASS, dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
  }

  private syncMediaListener(): void {
    if (typeof matchMedia !== 'function') {
      return;
    }
    if (!this.mediaQuery) {
      this.mediaQuery = matchMedia('(prefers-color-scheme: dark)');
    }
    this.mediaQuery.removeEventListener('change', this.onMediaChange);
    if (this.theme() === 'SYSTEM') {
      this.mediaQuery.addEventListener('change', this.onMediaChange);
    }
  }

  private systemPrefersDark(): boolean {
    if (typeof matchMedia !== 'function') {
      return false;
    }
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private readStored(): ThemePreference | null {
    try {
      const value = localStorage.getItem(THEME_STORAGE_KEY);
      return isThemePreference(value) ? value : null;
    } catch {
      return null;
    }
  }

  private writeStored(value: ThemePreference): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // Ignore quota / private-mode failures.
    }
  }
}
