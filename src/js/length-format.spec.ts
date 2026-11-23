import { describe, expect, it } from 'vitest';

import { formatLength, parseDecimal } from './length-format';

describe('formatLength', () => {
  it('shows metres under 1 km', () => {
    expect(formatLength(560, 'en')).toEqual({ value: '560', unit: 'm' });
    expect(formatLength(0, 'en')).toEqual({ value: '0', unit: 'm' });
    expect(formatLength(999.6, 'en')).toEqual({ value: '1,000', unit: 'm' });
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
