import { formatAmountInputDigits } from './money-amount-input';

/**
 * Format integer minor-unit balances for display (no FX / no cross-currency totals).
 * Uses locale thousand separators; negative amounts get an LTR mark so `-` stays
 * before the digits even inside RTL paragraphs (CSS isolate is applied on amount nodes too).
 */
export function formatBalanceMinor(
  balanceMinor: string,
  currency: string,
  showToman: boolean,
  labels: { toman: string; rials: string; cents: string },
  locale: string,
): string {
  const minor = BigInt(balanceMinor);
  if (currency === 'IRR' && showToman) {
    return `${formatTomanBody(minor, locale)} ${labels.toman}`;
  }
  return `${formatSignedGrouped(minor, locale)} ${minorUnitLabel(currency, labels)}`;
}

export function minorUnitLabel(
  currency: string,
  labels: { rials: string; cents: string },
): string {
  if (currency === 'IRR') return labels.rials;
  if (currency === 'USD') return labels.cents;
  return currency;
}

/** Group absolute digits; prefix negatives with LTR mark + `-`. */
export function formatSignedGrouped(minor: bigint, locale: string): string {
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  const grouped = formatAmountInputDigits(abs.toString(), locale);
  return negative ? `\u200E-${grouped}` : grouped;
}

function formatTomanBody(minor: bigint, locale: string): string {
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  const toman = abs / 10n;
  const rem = abs % 10n;
  const grouped = formatAmountInputDigits(toman.toString(), locale);
  const body = rem === 0n ? grouped : `${grouped}.${rem.toString()}`;
  return negative ? `\u200E-${body}` : body;
}
