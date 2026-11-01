import { formatBalanceMinor, formatSignedGrouped, minorUnitLabel } from './money-display';

const labels = { toman: 'toman', rials: 'rials', cents: 'cents' };

describe('formatSignedGrouped', () => {
  it('groups positive amounts', () => {
    expect(formatSignedGrouped(1234567n, 'en')).toBe('1,234,567');
    expect(formatSignedGrouped(1234567n, 'fa')).toBe('1\u066C234\u066C567');
  });

  it('keeps minus before digits with LTR mark', () => {
    expect(formatSignedGrouped(-12000n, 'en')).toBe('\u200E-12,000');
  });
});

describe('minorUnitLabel', () => {
  it('uses rials for IRR and cents for USD/EUR', () => {
    expect(minorUnitLabel('IRR', labels, 'en')).toBe('rials');
    expect(minorUnitLabel('USD', labels, 'en')).toBe('cents');
    expect(minorUnitLabel('EUR', labels, 'en')).toBe('cents');
  });

  it('uses the localized currency name for zero-fraction JPY', () => {
    const label = minorUnitLabel('JPY', labels, 'en');
    expect(label).not.toBe('cents');
    expect(label.toLowerCase()).toContain('yen');
  });
});

describe('formatBalanceMinor', () => {
  it('formats IRR rials with separators', () => {
    expect(formatBalanceMinor('1500000', 'IRR', false, labels, 'en')).toBe(
      '1,500,000 rials',
    );
  });

  it('formats IRR toman with separators and remainder', () => {
    expect(formatBalanceMinor('1500001', 'IRR', true, labels, 'en')).toBe(
      '150,000.1 toman',
    );
  });

  it('formats negative toman with leading minus', () => {
    expect(formatBalanceMinor('-15000', 'IRR', true, labels, 'fa')).toBe(
      '\u200E-1\u066C500 toman',
    );
  });

  it('formats USD cents', () => {
    expect(formatBalanceMinor('1299', 'USD', false, labels, 'en')).toBe(
      '1,299 cents',
    );
  });

  it('formats JPY with the currency name, not cents', () => {
    const formatted = formatBalanceMinor('1299', 'JPY', false, labels, 'en');
    expect(formatted.startsWith('1,299 ')).toBe(true);
    expect(formatted.toLowerCase()).toContain('yen');
    expect(formatted).not.toContain('cents');
  });
});
