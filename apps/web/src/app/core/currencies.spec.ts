import {
  UI_CURRENCIES,
  currencyFractionDigits,
  currencyLabel,
  currencyOptions,
} from './currencies';

describe('currencyLabel', () => {
  it('returns Name (CODE) for known currencies', () => {
    expect(currencyLabel('EUR', 'en')).toMatch(/\(EUR\)$/);
    expect(currencyLabel('EUR', 'en').toLowerCase()).toContain('euro');
    expect(currencyLabel('JPY', 'en')).toMatch(/\(JPY\)$/);
  });

  it('falls back to the ISO code when DisplayNames has nothing useful', () => {
    expect(currencyLabel('ZZZ', 'en')).toBe('ZZZ');
  });

  it('normalizes lowercase codes', () => {
    expect(currencyLabel('eur', 'en')).toMatch(/\(EUR\)$/);
  });
});

describe('currencyOptions', () => {
  it('covers the Iranian-first allowlist with searchable labels', () => {
    const options = currencyOptions('en');
    expect(options.map((o) => o.value)).toEqual([...UI_CURRENCIES]);
    expect(options.every((o) => o.label.includes(`(${o.value})`))).toBe(true);
  });
});

describe('currencyFractionDigits', () => {
  it('reports zero for JPY and two for EUR', () => {
    expect(currencyFractionDigits('JPY', 'en')).toBe(0);
    expect(currencyFractionDigits('EUR', 'en')).toBe(2);
  });
});
