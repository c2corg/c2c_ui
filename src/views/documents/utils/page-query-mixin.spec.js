import { describe, expect, it } from 'vitest';

import pageQueryMixin from './page-query-mixin';

function withQuery(query) {
  const self = { $route: { name: 'routes', params: {}, query } };
  for (const [key, getter] of Object.entries(pageQueryMixin.computed)) {
    Object.defineProperty(self, key, { get: getter.bind(self) });
  }
  for (const [key, method] of Object.entries(pageQueryMixin.methods)) {
    self[key] = method.bind(self);
  }
  return self;
}

describe('page query mixin', () => {
  it('falls back on defaults and bounds the limit', () => {
    expect(withQuery({}).offset).toBe(0);
    expect(withQuery({}).queryLimit).toBe(30);
    expect(withQuery({ offset: '-5', limit: 'abc' }).offset).toBe(0);
    expect(withQuery({ limit: '0' }).queryLimit).toBe(30);
    expect(withQuery({ limit: '500' }).queryLimit).toBe(100);
  });

  it('aligns the offset on the page size', () => {
    const query = withQuery({ offset: '30', bbox: '1,2,3,4' }).pageQuery(30, 100).query;
    expect(query).toEqual({ offset: 0, limit: 100, bbox: '1,2,3,4' });
    expect(withQuery({}).pageQuery(130, 50).query).toEqual({ offset: 100, limit: 50 });
  });

  it('gives the last page when the offset is past the total', () => {
    expect(withQuery({ offset: '60' }).lastPageQuery(100)).toBeNull();
    expect(withQuery({ offset: '60' }).lastPageQuery(0)).toBeNull();
    expect(withQuery({ offset: '240' }).lastPageQuery(45).query).toEqual({ offset: 30, limit: 30 });
    expect(withQuery({ offset: '240' }).lastPageQuery(60).query).toEqual({ offset: 30, limit: 30 });
  });
});
