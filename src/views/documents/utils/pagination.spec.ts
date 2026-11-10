import { describe, expect, it } from 'vitest';

import { getPages } from './pagination';

describe('getPages', () => {
  it('lists every page when there are few', () => {
    expect(getPages(1, 1)).toEqual([1]);
    expect(getPages(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('gives nothing for an unusable page count', () => {
    expect(getPages(1, Infinity)).toEqual([]);
    expect(getPages(1, NaN)).toEqual([]);
    expect(getPages(1, 0)).toEqual([]);
  });

  it('collapses far pages', () => {
    expect(getPages(1, 20)).toEqual([1, 2, null, 20]);
    expect(getPages(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
    expect(getPages(20, 20)).toEqual([1, null, 19, 20]);
  });

  it('does not hide a single page behind a gap', () => {
    expect(getPages(4, 20)).toEqual([1, 2, 3, 4, 5, null, 20]);
    expect(getPages(17, 20)).toEqual([1, null, 16, 17, 18, 19, 20]);
  });
});
