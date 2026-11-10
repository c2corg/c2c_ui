import { describe, expect, it } from 'vitest';

import { documentOverlayFilters, heatmapWeight, searchOverlayFilters, sortTracks } from './density-overlays';

describe('documentOverlayFilters', () => {
  it('shows the outings of a route, and the routes of its activities', () => {
    expect(documentOverlayFilters({ type: 'r', document_id: 4, activities: ['skitouring', 'snowshoeing'] })).toEqual({
      outing: { r: 4 },
      route: { act: 'skitouring,snowshoeing' },
    });
  });

  it('shows all the routes around a route without activities', () => {
    expect(documentOverlayFilters({ type: 'r', document_id: 4 })).toEqual({ outing: { r: 4 }, route: null });
    expect(documentOverlayFilters({ type: 'r', document_id: 4, activities: [] }).route).toBeNull();
  });

  it('shows what is linked to a waypoint or an area', () => {
    expect(documentOverlayFilters({ type: 'w', document_id: 5 })).toEqual({ outing: { w: 5 }, route: { w: 5 } });
    expect(documentOverlayFilters({ type: 'a', document_id: 6 })).toEqual({ outing: { a: 6 }, route: { a: 6 } });
  });

  it('shows the outings of a profile', () => {
    expect(documentOverlayFilters({ type: 'u', document_id: 7 })).toEqual({ outing: { u: 7 }, route: null });
  });

  it('shows the routes of an outing, and the outings of any of them', () => {
    const outing = { type: 'o', document_id: 8, associations: { routes: [{ document_id: 1 }, { document_id: 2 }] } };

    expect(documentOverlayFilters(outing)).toEqual({ outing: { r: '1,2' }, route: { ids: '1,2' } });
  });

  it('shows nothing for an outing without routes', () => {
    // `ids` with an empty list matches nothing, whereas `r` with one would match every outing
    expect(documentOverlayFilters({ type: 'o', document_id: 8 })).toEqual({ outing: { ids: '' }, route: { ids: '' } });
  });

  it('does not filter the other documents', () => {
    expect(documentOverlayFilters({ type: 'b', document_id: 9 })).toEqual({ outing: null, route: null });
    expect(documentOverlayFilters({ type: 'r' })).toEqual({ outing: null, route: null });
  });
});

describe('searchOverlayFilters', () => {
  const query = { act: 'hiking', date: '2016-01-01', offset: '30', sort: 'id', bbox: '1,2,3,4', pl: 'fr' };

  it('does not filter anything for a search without filters, nor for its pagination or its sort', () => {
    // the whole listing of outings, or of routes: the overlays only get the box of the map
    expect(searchOverlayFilters('outing', {})).toEqual({ outing: {}, route: null });
    expect(searchOverlayFilters('route', {})).toEqual({ outing: null, route: {} });
    expect(searchOverlayFilters('route', { offset: '30', limit: '30', sort: 'id' })).toEqual({
      outing: null,
      route: {},
    });
  });

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

  it('gives the other overlay the filters that mean the same for both: areas, waypoints, users, ratings', () => {
    const search = { act: 'skitouring', a: '14384', w: '37268', u: '5', trat: '2.1,3.3', grat: 'AD', q: 'Telliers' };

    expect(searchOverlayFilters('route', search).outing).toEqual({
      act: 'skitouring',
      a: '14384',
      w: '37268',
      u: '5',
      trat: '2.1,3.3',
      grat: 'AD',
    });
    expect(searchOverlayFilters('outing', search).route).toEqual({
      act: 'skitouring',
      a: '14384',
      w: '37268',
      u: '5',
      trat: '2.1,3.3',
      grat: 'AD',
    });
  });

  it('does not give the other overlay what is about the documents searched: title, dates, quality', () => {
    expect(
      searchOverlayFilters('outing', { q: 'Telliers', date: '2024-01-01', qa: 'great', ofreq: 'quiet' }).route
    ).toBeNull();
    expect(searchOverlayFilters('route', { q: 'Telliers', qa: 'great', walt: '2000,3000' }).outing).toBeNull();
  });

  it('shows the routes of the outings searched on given routes', () => {
    expect(searchOverlayFilters('outing', { r: '4,5', act: 'hiking' })).toEqual({
      outing: { r: '4,5', act: 'hiking' },
      route: { act: 'hiking', ids: '4,5' },
    });
    expect(searchOverlayFilters('outing', { r: '4' }).route).toEqual({ ids: '4' });
  });

  it('does not filter the overlays of the other document types', () => {
    expect(searchOverlayFilters('waypoint', query)).toEqual({ outing: null, route: null });
  });
});

describe('sortTracks', () => {
  const outing = (document_id: number, date_end: string) => ({
    document_id,
    type: 'o',
    title: `Outing ${document_id}`,
    date_end,
  });
  const route = (document_id: number, title: string) => ({ document_id, type: 'r', title });

  it('puts the most recent outings first', () => {
    const tracks = [outing(1, '2024-02-18'), outing(2, '2024-12-15'), outing(3, '2017-12-23')];

    expect(sortTracks(tracks).map((track) => track.document_id)).toEqual([2, 1, 3]);
  });

  it('puts the latest created first among the outings of a day', () => {
    const tracks = [outing(1, '2024-12-15'), outing(5, '2024-12-15'), outing(3, '2024-12-15')];

    expect(sortTracks(tracks).map((track) => track.document_id)).toEqual([5, 3, 1]);
  });

  it('lists the routes, by title, before the outings, which are more numerous', () => {
    const tracks = [route(10, 'Normale'), outing(1, '2024-02-18'), route(11, 'Arête'), outing(2, '2024-12-15')];

    expect(sortTracks(tracks).map((track) => track.document_id)).toEqual([11, 10, 2, 1]);
  });

  it('does not change the list it is given', () => {
    const tracks = [outing(1, '2020-01-01'), outing(2, '2024-01-01')];
    sortTracks(tracks);

    expect(tracks.map((track) => track.document_id)).toEqual([1, 2]);
  });
});

describe('heatmapWeight', () => {
  it('goes from 0 to 1', () => {
    expect(heatmapWeight(0, 100)).toBe(0);
    expect(heatmapWeight(100, 100)).toBe(1);
  });

  it('does not leave the places with few documents in the dark next to the busiest one', () => {
    // a tenth of the documents of the busiest place: far more than a tenth of its weight
    expect(heatmapWeight(10, 100)).toBeGreaterThan(0.4);
    expect(heatmapWeight(2, 100)).toBeGreaterThan(heatmapWeight(1, 100));
  });

  it('copes with an empty map', () => {
    expect(heatmapWeight(0, 0)).toBe(0);
  });
});
