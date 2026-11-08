import { describe, expect, it } from 'vitest';

import { documentOverlayFilters, searchOverlayFilters } from './density-overlays';

describe('documentOverlayFilters', () => {
  it('shows the outings of a route, and all its routes', () => {
    expect(documentOverlayFilters({ type: 'r', document_id: 4 })).toEqual({ outing: { r: 4 }, route: null });
  });

  it('shows what is linked to a waypoint or an area', () => {
    expect(documentOverlayFilters({ type: 'w', document_id: 5 })).toEqual({ outing: { w: 5 }, route: { w: 5 } });
    expect(documentOverlayFilters({ type: 'a', document_id: 6 })).toEqual({ outing: { a: 6 }, route: { a: 6 } });
  });

  it('shows the outings of a profile', () => {
    expect(documentOverlayFilters({ type: 'u', document_id: 7 })).toEqual({ outing: { u: 7 }, route: null });
  });

  it('shows only the routes of an outing', () => {
    const outing = { type: 'o', document_id: 8, associations: { routes: [{ document_id: 1 }, { document_id: 2 }] } };

    expect(documentOverlayFilters(outing)).toEqual({ outing: null, route: { ids: '1,2' } });
  });

  it('shows no route for an outing without routes', () => {
    expect(documentOverlayFilters({ type: 'o', document_id: 8 })).toEqual({ outing: null, route: { ids: '' } });
  });

  it('does not filter the other documents', () => {
    expect(documentOverlayFilters({ type: 'b', document_id: 9 })).toEqual({ outing: null, route: null });
    expect(documentOverlayFilters({ type: 'r' })).toEqual({ outing: null, route: null });
  });
});

describe('searchOverlayFilters', () => {
  const query = { act: 'hiking', date: '2016-01-01', offset: '30', sort: 'id', bbox: '1,2,3,4', pl: 'fr' };

  it('applies the search filters to the overlay of the searched type', () => {
    expect(searchOverlayFilters('outing', query)).toEqual({
      outing: { act: 'hiking', date: '2016-01-01' },
      route: { act: 'hiking' },
    });
    expect(searchOverlayFilters('route', query)).toEqual({
      outing: { act: 'hiking' },
      route: { act: 'hiking', date: '2016-01-01' },
    });
  });

  it('gives nothing to the other overlay without activities', () => {
    expect(searchOverlayFilters('outing', { date: '2016-01-01' })).toEqual({
      outing: { date: '2016-01-01' },
      route: null,
    });
  });

  it('ignores the filters given more than once', () => {
    expect(searchOverlayFilters('route', { act: ['hiking', 'skitouring'] })).toEqual({ outing: null, route: {} });
  });

  it('does not filter the overlays of the other document types', () => {
    expect(searchOverlayFilters('waypoint', query)).toEqual({ outing: null, route: null });
  });
});
