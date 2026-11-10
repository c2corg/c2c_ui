import { describe, expect, it } from 'vitest';

import { getLimit, getOffset, normalizedPageQuery, pageQuery, pageStartFor } from './page-query';

const routeWith = (query: Record<string, string>) => ({ name: 'routes', params: {}, query });

describe('page query', () => {
  it('falls back on defaults and bounds the limit', () => {
    expect(getOffset(routeWith({}))).toBe(0);
    expect(getLimit(routeWith({}))).toBe(30);
    expect(getOffset(routeWith({ offset: '-5' }))).toBe(0);
    expect(getOffset(routeWith({ offset: 'abc' }))).toBe(0);
    expect(getLimit(routeWith({ limit: 'abc' }))).toBe(30);
    expect(getLimit(routeWith({ limit: '0' }))).toBe(30);
    expect(getLimit(routeWith({ limit: '500' }))).toBe(100);
  });

  it('finds the page an offset belongs to, within the results', () => {
    expect(pageStartFor(60, 30, 100)).toBe(60);
    expect(pageStartFor(45, 30, 100)).toBe(30);
    expect(pageStartFor(240, 30, 45)).toBe(30);
    expect(pageStartFor(240, 30, 60)).toBe(30);
    expect(pageStartFor(240, 30, null)).toBe(240);
    expect(pageStartFor(30, 30, 0)).toBe(0);
  });

  it('keeps the other parameters and bounds the limit when building a page url', () => {
    expect(pageQuery(routeWith({ bbox: '1,2,3,4' }), 60, 500)).toEqual({
      name: 'routes',
      params: {},
      query: { bbox: '1,2,3,4', offset: '60', limit: '100' },
    });
    expect(pageQuery(routeWith({}), -30, 30)).toMatchObject({ query: { offset: '0' } });
  });

  it('only asks for another url when it does not point at a page', () => {
    expect(normalizedPageQuery(routeWith({}), null)).toBeNull();
    expect(normalizedPageQuery(routeWith({ offset: '30', limit: '30' }), 100)).toBeNull();
    expect(normalizedPageQuery(routeWith({ offset: '60' }), null)).toBeNull();
    // the range is only checked once the total is known
    expect(normalizedPageQuery(routeWith({ offset: '240' }), null)).toBeNull();
    expect(normalizedPageQuery(routeWith({ offset: '45' }), null)).toMatchObject({
      query: { offset: '30', limit: '30' },
    });
    expect(normalizedPageQuery(routeWith({ limit: '500' }), null)).toMatchObject({
      query: { offset: '0', limit: '100' },
    });
    expect(normalizedPageQuery(routeWith({ offset: '240' }), 45)).toMatchObject({
      query: { offset: '30', limit: '30' },
    });
    // nothing left on the page: back to the first one
    expect(normalizedPageQuery(routeWith({ offset: '30' }), 0)).toMatchObject({ query: { offset: '0', limit: '30' } });
    expect(normalizedPageQuery(routeWith({ offset: '30', limit: '50' }), 100)).toMatchObject({
      query: { offset: '0', limit: '50' },
    });
  });
});
