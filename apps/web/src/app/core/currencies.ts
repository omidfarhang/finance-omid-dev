/** Iranian-first UI picker allowlist. API/DB accept any ISO 4217 code. */
export const UI_CURRENCIES = [
  'IRR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'TRY',
  'CAD',
  'AUD',
  'CHF',
  'JPY',
] as const;

export type UiCurrency = (typeof UI_CURRENCIES)[number];

/** Localized currency name with ISO code, e.g. `Euro (EUR)`. */
export function currencyLabel(code: string, locale: string): string {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    return code;
  }
  try {
    const name = new Intl.DisplayNames([locale], { type: 'currency' }).of(
      normalized,
    );
    if (!name || name === normalized) {
      return normalized;
    }
    return `${name} (${normalized})`;
  } catch {
    return normalized;
  }
}

export function currencyOptions(
  locale: string,
): { label: string; value: UiCurrency }[] {
  return UI_CURRENCIES.map((value) => ({
    label: currencyLabel(value, locale),
    value,
  }));
}

/** ISO 4217 fraction digits for amount minor-unit labeling. */
export function currencyFractionDigits(
  currency: string,
  locale = 'en',
): number {
  const normalized = currency.trim().toUpperCase();
  try {
    const digits = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalized,
    }).resolvedOptions().maximumFractionDigits;
    return typeof digits === 'number' ? digits : 2;
  } catch {
    return 2;
  }
}
