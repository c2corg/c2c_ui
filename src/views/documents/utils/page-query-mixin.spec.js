import { describe, expect, it } from 'vitest';

import pageQueryMixin from './page-query-mixin';

function withQuery(query, total = 100) {
  const self = { total, $route: { name: 'routes', params: {}, query } };
  for (const [key, getter] of Object.entries(pageQueryMixin.computed)) {
    Object.defineProperty(self, key, { get: getter.bind(self) });
  }
  for (const [key, method] of Object.entries(pageQueryMixin.methods)) {
    self[key] = method.bind(self);
  }
  return self;
}

const offsetOf = (location) => (location ? location.query.offset : null);

describe('page query mixin', () => {
  it('falls back on defaults and bounds the limit', () => {
    expect(withQuery({}).offset).toBe(0);
    expect(withQuery({}).queryLimit).toBe(30);
    expect(withQuery({ offset: '-5', limit: 'abc' }).offset).toBe(0);
    expect(withQuery({ limit: '0' }).queryLimit).toBe(30);
    expect(withQuery({ limit: '500' }).queryLimit).toBe(100);
  });

  it('shows the page the offset belongs to, within the results', () => {
    expect(withQuery({ offset: '60' }).pageStart).toBe(60);
    expect(withQuery({ offset: '45' }).pageStart).toBe(30);
    expect(withQuery({ offset: '240' }, 45).pageStart).toBe(30);
    expect(withQuery({ offset: '240' }, 60).pageStart).toBe(30);
    expect(withQuery({ offset: '240' }, 0).pageStart).toBe(240);
  });

  it('leads to the same previous and next pages, whatever the offset in the url', () => {
    expect([30, 45, 59].map((offset) => offsetOf(withQuery({ offset: String(offset) }).previousPageQuery))).toEqual([
      0, 0, 0,
    ]);
    expect([30, 45, 59].map((offset) => offsetOf(withQuery({ offset: String(offset) }).nextPageQuery))).toEqual([
      60, 60, 60,
    ]);
    expect(withQuery({}).previousPageQuery).toBeNull();
    expect(offsetOf(withQuery({}).nextPageQuery)).toBe(30);
    expect(withQuery({ offset: '90' }).nextPageQuery).toBeNull();
    expect(offsetOf(withQuery({ offset: '240' }, 45).previousPageQuery)).toBe(0);
    expect(withQuery({ offset: '240' }, 45).nextPageQuery).toBeNull();
  });

  it('keeps the first displayed page when the limit changes', () => {
    expect(withQuery({ offset: '30', bbox: '1,2,3,4' }).limitQuery(100).query).toEqual({
      offset: 0,
      limit: 100,
      bbox: '1,2,3,4',
    });
    expect(withQuery({ offset: '60', limit: '30' }).limitQuery(50).query).toEqual({ offset: 50, limit: 50 });
  });

  it('only asks for another url when it does not point at a page', () => {
    expect(withQuery({}).normalizedPageQuery(0)).toBeNull();
    expect(withQuery({ offset: '30', limit: '30' }).normalizedPageQuery(100)).toBeNull();
    expect(withQuery({ offset: '45' }).normalizedPageQuery(0).query).toEqual({ offset: 30, limit: 30 });
    expect(withQuery({ limit: '500' }).normalizedPageQuery(0).query).toEqual({ offset: 0, limit: 100 });
    expect(withQuery({ offset: '60' }).normalizedPageQuery(0)).toBeNull();
    expect(withQuery({ offset: '240' }).normalizedPageQuery(45).query).toEqual({ offset: 30, limit: 30 });
    expect(withQuery({ offset: '240' }).normalizedPageQuery(0)).toBeNull(); // the range is only checked once the total is known
  });
});
