import { normalizeDigits } from './parse-app-date';

/** Locale thousand separator for amount fields (`fa` → U+066C, else `,`). */
export function amountGroupSeparator(locale: string): string {
  return locale.startsWith('fa') ? '\u066C' : ',';
}

/** True for Latin, Persian, or Arabic-Indic digit characters. */
export function isAmountDigitChar(ch: string): boolean {
  return (
    (ch >= '0' && ch <= '9') ||
    (ch >= '\u06F0' && ch <= '\u06F9') || // Persian ۰-۹
    (ch >= '\u0660' && ch <= '\u0669') // Arabic-Indic ٠-٩
  );
}

/**
 * Format an ASCII digit string (optional leading `-`) with thousand separators.
 * Digits stay Latin so caret math and numeric keyboards stay predictable.
 */
export function formatAmountInputDigits(digits: string, locale: string): string {
  if (!digits) {
    return '';
  }
  const negative = digits.startsWith('-');
  const body = negative ? digits.slice(1) : digits;
  if (!body) {
    return negative ? '-' : '';
  }
  const sep = amountGroupSeparator(locale);
  const grouped = body.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return negative ? `-${grouped}` : grouped;
}

/**
 * Strip grouping / junk from a typed amount; normalize Persian/Arabic-Indic digits.
 * Returns an ASCII digit string (optional leading `-` when `allowNegative`).
 */
export function parseAmountInputValue(
  raw: string,
  allowNegative = false,
): string {
  const normalized = normalizeDigits(raw).trim();
  let negative = false;
  let rest = normalized;
  if (allowNegative && rest.startsWith('-')) {
    negative = true;
    rest = rest.slice(1);
  }
  const digits = rest.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) {
    return negative ? '-' : '';
  }
  return negative ? `-${digits}` : digits;
}

/** Index in `formatted` after the first `digitCount` digit characters (and optional leading `-`). */
export function caretIndexAfterDigits(
  formatted: string,
  digitCount: number,
): number {
  if (digitCount <= 0) {
    return formatted.startsWith('-') ? 1 : 0;
  }
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    const ch = formatted[i]!;
    if (ch >= '0' && ch <= '9') {
      seen += 1;
      if (seen === digitCount) {
        return i + 1;
      }
    }
  }
  return formatted.length;
}

/** Count Latin + Persian + Arabic-Indic digits (for caret placement before normalize). */
export function countAmountDigits(value: string): number {
  let n = 0;
  for (const ch of value) {
    if (isAmountDigitChar(ch)) {
      n += 1;
    }
  }
  return n;
}
