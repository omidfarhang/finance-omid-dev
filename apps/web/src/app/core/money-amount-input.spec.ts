import {
  amountGroupSeparator,
  caretIndexAfterDigits,
  countAmountDigits,
  formatAmountInputDigits,
  isAmountDigitChar,
  parseAmountInputValue,
} from './money-amount-input';

describe('amountGroupSeparator', () => {
  it('uses Persian separator for fa', () => {
    expect(amountGroupSeparator('fa')).toBe('\u066C');
  });

  it('uses comma for en', () => {
    expect(amountGroupSeparator('en')).toBe(',');
  });
});

describe('isAmountDigitChar', () => {
  it('accepts Latin, Persian, and Arabic-Indic digits', () => {
    expect(isAmountDigitChar('5')).toBe(true);
    expect(isAmountDigitChar('۵')).toBe(true);
    expect(isAmountDigitChar('٥')).toBe(true);
    expect(isAmountDigitChar(',')).toBe(false);
    expect(isAmountDigitChar('\u066C')).toBe(false);
  });
});

describe('formatAmountInputDigits', () => {
  it('groups with commas for en', () => {
    expect(formatAmountInputDigits('1234567', 'en')).toBe('1,234,567');
  });

  it('groups with Persian separator for fa', () => {
    expect(formatAmountInputDigits('1234567', 'fa')).toBe('1\u066C234\u066C567');
  });

  it('preserves leading minus', () => {
    expect(formatAmountInputDigits('-12000', 'en')).toBe('-12,000');
  });

  it('handles empty and lone minus', () => {
    expect(formatAmountInputDigits('', 'en')).toBe('');
    expect(formatAmountInputDigits('-', 'en')).toBe('-');
  });
});

describe('parseAmountInputValue', () => {
  it('strips separators and keeps digits', () => {
    expect(parseAmountInputValue('1,234,567')).toBe('1234567');
    expect(parseAmountInputValue('1\u066C234\u066C567')).toBe('1234567');
  });

  it('normalizes Persian digits', () => {
    expect(parseAmountInputValue('۱۲۳۴۵۶۷')).toBe('1234567');
    expect(parseAmountInputValue('۱٬۲۳۴٬۵۶۷')).toBe('1234567');
  });

  it('normalizes Arabic-Indic digits', () => {
    expect(parseAmountInputValue('١٢٣٤٥٦٧')).toBe('1234567');
  });

  it('normalizes mixed scripts and separators', () => {
    expect(parseAmountInputValue('1,۲۳۴٥٦٧')).toBe('1234567');
  });

  it('strips leading zeros', () => {
    expect(parseAmountInputValue('۰۰۰۱۲۳')).toBe('123');
    expect(parseAmountInputValue('٠')).toBe('0');
    expect(parseAmountInputValue('0')).toBe('0');
  });

  it('allows leading minus only when enabled', () => {
    expect(parseAmountInputValue('-12,000', true)).toBe('-12000');
    expect(parseAmountInputValue('-۱۲٬۰۰۰', true)).toBe('-12000');
    expect(parseAmountInputValue('-12,000', false)).toBe('12000');
    expect(parseAmountInputValue('-', true)).toBe('-');
  });
});

describe('caretIndexAfterDigits', () => {
  it('places caret after digit count including separators', () => {
    expect(caretIndexAfterDigits('1,234,567', 1)).toBe(1);
    expect(caretIndexAfterDigits('1,234,567', 4)).toBe(5);
    expect(caretIndexAfterDigits('-12,000', 2)).toBe(3);
  });
});

describe('countAmountDigits', () => {
  it('counts Latin digits', () => {
    expect(countAmountDigits('1,234')).toBe(4);
    expect(countAmountDigits('-12')).toBe(2);
  });

  it('counts Persian and Arabic-Indic digits for caret', () => {
    expect(countAmountDigits('۱۲۳')).toBe(3);
    expect(countAmountDigits('١٬٢٣٤')).toBe(4);
    expect(countAmountDigits('1,۲۳۴۵')).toBe(5);
  });
});
