import { Injectable, signal } from '@angular/core';

/** localStorage key for IRR presentation as toman (÷ 10). */
export const SHOW_TOMAN_STORAGE_KEY = 'finance.showToman';

@Injectable({ providedIn: 'root' })
export class MoneyDisplayPreferenceService {
  readonly showToman = signal(this.readStored());

  setShowToman(value: boolean): void {
    this.showToman.set(value);
    this.writeStored(value);
  }

  private readStored(): boolean {
    try {
      return localStorage.getItem(SHOW_TOMAN_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private writeStored(value: boolean): void {
    try {
      localStorage.setItem(SHOW_TOMAN_STORAGE_KEY, value ? '1' : '0');
    } catch {
      // Ignore quota / private-mode failures.
    }
  }
}
