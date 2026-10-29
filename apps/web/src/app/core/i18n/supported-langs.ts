export type UiLang = 'fa' | 'en';
export type TextDir = 'rtl' | 'ltr';

export type SupportedLang = {
  id: UiLang;
  labelKey: string;
  dir: TextDir;
};

export const SUPPORTED_LANGS: readonly SupportedLang[] = [
  { id: 'fa', labelKey: 'app.lang.fa', dir: 'rtl' },
  { id: 'en', labelKey: 'app.lang.en', dir: 'ltr' },
] as const;

export const DEFAULT_UI_LANG: UiLang = 'fa';
export const UI_LANG_STORAGE_KEY = 'finance.uiLang';

export function isUiLang(value: string | null | undefined): value is UiLang {
  return value === 'fa' || value === 'en';
}

/** Map a BCP-47 locale (e.g. fa-IR) to a supported UI language tag. */
export function toUiLang(locale: string | null | undefined): UiLang | null {
  if (!locale) {
    return null;
  }
  const primary = locale.trim().toLowerCase().split(/[-_]/)[0];
  return isUiLang(primary) ? primary : null;
}
