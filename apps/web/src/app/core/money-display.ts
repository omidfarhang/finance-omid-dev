/** Format integer minor-unit balances for display (no FX / no cross-currency totals). */
export function formatBalanceMinor(
  balanceMinor: string,
  currency: string,
  showToman: boolean,
  labels: { toman: string; rials: string; cents: string },
): string {
  const minor = BigInt(balanceMinor);
  if (currency === 'IRR' && showToman) {
    const toman = minor / 10n;
    const rem = minor % 10n;
    const body = rem === 0n ? toman.toString() : `${toman}.${rem.toString()}`;
    return `${body} ${labels.toman}`;
  }
  return `${balanceMinor} ${minorUnitLabel(currency, labels)}`;
}

export function minorUnitLabel(
  currency: string,
  labels: { rials: string; cents: string },
): string {
  if (currency === 'IRR') return labels.rials;
  if (currency === 'USD') return labels.cents;
  return currency;
}
