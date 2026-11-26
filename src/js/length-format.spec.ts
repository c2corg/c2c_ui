import { describe, expect, it } from 'vitest';

import { formatLength, formatNumber, parseDecimal, formatDistance } from './length-format';

describe('formatLength', () => {
  it('shows metres under 1 km', () => {
    expect(formatLength(560, 'en')).toEqual({ value: '560', unit: 'm' });
    expect(formatLength(0, 'en')).toEqual({ value: '0', unit: 'm' });
    expect(formatLength(999.6, 'en')).toEqual({ value: '1000', unit: 'm' });
  });

  it('shows one decimal under 10 km, none when it is zero', () => {
    expect(formatLength(4520, 'en')).toEqual({ value: '4.5', unit: 'km' });
    expect(formatLength(1000, 'en')).toEqual({ value: '1', unit: 'km' });
    expect(formatLength(9940, 'en')).toEqual({ value: '9.9', unit: 'km' });
  });

  it('shows whole km from 10 km', () => {
    expect(formatLength(9960, 'en')).toEqual({ value: '10', unit: 'km' });
    expect(formatLength(12300, 'en')).toEqual({ value: '12', unit: 'km' });
  });

  it('uses the decimal separator of the language, zh_CN included', () => {
    expect(formatLength(4520, 'fr')).toEqual({ value: '4,5', unit: 'km' });
    expect(formatLength(4520, 'zh_CN')).toEqual({ value: '4.5', unit: 'km' });
  });
});

describe('formatNumber', () => {
  it('writes no thousands separator, as the topoguide does, and the decimal separator of the language', () => {
    for (const lang of ['fr', 'en', 'de', 'it', 'ru', 'zh_CN']) {
      expect(formatNumber(4808, lang)).toBe('4808');
      expect(formatNumber(12345, lang)).toBe('12345');
    }
    expect(formatNumber(4.5, 'fr', { maximumFractionDigits: 1 })).toBe('4,5');
    expect(formatNumber(4.5, 'en', { maximumFractionDigits: 1 })).toBe('4.5');
    expect(formatNumber(4.5, 'de', { maximumFractionDigits: 1 })).toBe('4,5');
  });

  it('rounds to whole numbers unless told, and reads numeric strings', () => {
    expect(formatNumber(2399.6, 'en')).toBe('2400');
    expect(formatNumber(1.5, 'fr', { minimumFractionDigits: 2 })).toBe('1,50');
    expect(formatNumber('2400', 'de')).toBe('2400');
  });

  it('gives back what is not a number, and nothing for no value', () => {
    expect(formatNumber('treeline', 'fr')).toBe('treeline');
    expect(formatNumber(null, 'fr')).toBe('');
    expect(formatNumber(undefined, 'fr')).toBe('');
  });
});

describe('formatDistance', () => {
  it('rounds to 10 m under 1 km, then as a length', () => {
    expect(formatDistance(234, 'fr')).toBe('230 m');
    expect(formatDistance(36, 'en')).toBe('40 m');
    expect(formatDistance(996, 'fr')).toBe('1 km');
    expect(formatDistance(1234, 'fr')).toBe('1,2 km');
    expect(formatDistance(1234, 'en')).toBe('1.2 km');
    expect(formatDistance(14321, 'fr')).toBe('14 km');
  });
});

describe('parseDecimal', () => {
  it('reads a comma or a dot as decimal separator', () => {
    expect(parseDecimal('4,5')).toBe(4.5);
    expect(parseDecimal(' 0.56 ')).toBe(0.56);
    expect(parseDecimal('12')).toBe(12);
    expect(parseDecimal(',5')).toBe(0.5);
  });

  it('gives NaN for what is not a number', () => {
    expect(parseDecimal('4.5 km')).toBeNaN();
    expect(parseDecimal('1,234.5')).toBeNaN();
    expect(parseDecimal('abc')).toBeNaN();
  });
});
