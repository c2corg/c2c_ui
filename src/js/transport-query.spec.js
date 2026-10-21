import { describe, expect, it } from 'vitest';

import {
  MAX_RECENT_ADDRESSES,
  addRecentAddress,
  buildTransportQuery,
  formatTransportFrom,
  hasTransportQuery,
  parseTransportQuery,
  transportSearchKey,
  withoutTransportQuery,
} from './transport-query';

const search = {
  from: [5.12345, 45.67891],
  date: '2026-01-16',
  minDeparture: '08:00',
  maxReturn: '18:00',
};

describe('transport query', () => {
  describe('formatTransportFrom', () => {
    it('rounds the coordinates, whatever their format', () => {
      expect(formatTransportFrom([5.12345, 45.67891])).toBe('5.123;45.679');
      expect(formatTransportFrom({ geometry: { coordinates: [5.12345, 45.67891] } })).toBe('5.123;45.679');
      expect(formatTransportFrom('5.12345;45.67891')).toBe('5.123;45.679');
    });

    it('gives the same value for starting points a few meters apart', () => {
      expect(formatTransportFrom([5.1001, 45.1001])).toBe(formatTransportFrom([5.1003, 45.1002]));
    });

    it('rejects invalid coordinates', () => {
      expect(formatTransportFrom(null)).toBeNull();
      expect(formatTransportFrom('5.1')).toBeNull();
      expect(formatTransportFrom('a;b')).toBeNull();
      expect(formatTransportFrom({ properties: {} })).toBeNull();
    });
  });

  describe('buildTransportQuery', () => {
    it('prefixes the parameters of the search', () => {
      expect(buildTransportQuery(search)).toEqual({
        transport_from: '5.123;45.679',
        transport_date: '2026-01-16',
        transport_min_departure: '08:00',
        transport_max_return: '18:00',
      });
    });

    it('keeps the optional durations only when they are set', () => {
      const query = buildTransportQuery({ ...search, maxDuration: 90, hikingDuration: null });

      expect(query.transport_max_duration).toBe('90');
      expect(query).not.toHaveProperty('transport_hiking_duration');
    });
  });

  describe('parseTransportQuery', () => {
    it('reads what buildTransportQuery wrote', () => {
      const query = buildTransportQuery({ ...search, maxDuration: 90, hikingDuration: 60 });

      expect(parseTransportQuery(query)).toEqual({
        from: '5.123;45.679',
        date: '2026-01-16',
        minDeparture: '08:00',
        maxReturn: '18:00',
        maxDuration: 90,
        hikingDuration: 60,
      });
    });

    it('gives null for the optional durations that are missing or invalid', () => {
      const parsed = parseTransportQuery({ ...buildTransportQuery(search), transport_max_duration: 'abc' });

      expect(parsed.maxDuration).toBeNull();
      expect(parsed.hikingDuration).toBeNull();
    });

    it('needs a complete search', () => {
      const query = buildTransportQuery(search);
      delete query.transport_max_return;

      expect(parseTransportQuery(query)).toBeNull();
      expect(parseTransportQuery({})).toBeNull();
    });

    it('takes the first value of a repeated parameter', () => {
      const query = { ...buildTransportQuery(search), transport_date: ['2026-02-01', '2026-03-01'] };

      expect(parseTransportQuery(query).date).toBe('2026-02-01');
    });
  });

  it('detects the transport search of a query', () => {
    expect(hasTransportQuery(buildTransportQuery(search))).toBe(true);
    expect(hasTransportQuery({ act: 'hiking' })).toBe(false);
  });

  it('identifies a search', () => {
    const parsed = parseTransportQuery(buildTransportQuery(search));

    expect(transportSearchKey(parsed)).toBe(transportSearchKey({ ...parsed }));
    expect(transportSearchKey(parsed)).not.toBe(transportSearchKey({ ...parsed, maxReturn: '19:00' }));
  });

  it('removes the transport parameters and only them', () => {
    const query = { act: 'hiking', offset: '30', ...buildTransportQuery(search) };

    expect(withoutTransportQuery(query)).toEqual({ act: 'hiking', offset: '30' });
  });

  describe('addRecentAddress', () => {
    const address = (lon, lat, name = '') => ({ geometry: { coordinates: [lon, lat] }, properties: { name } });

    it('puts the new address first', () => {
      expect(addRecentAddress([address(1, 1, 'a')], address(2, 2, 'b')).map((a) => a.properties.name)).toEqual([
        'b',
        'a',
      ]);
    });

    it('does not keep the same starting point twice', () => {
      const recent = [address(5.1001, 45.1001, 'old'), address(2, 2, 'other')];

      expect(addRecentAddress(recent, address(5.1003, 45.1002, 'new')).map((a) => a.properties.name)).toEqual([
        'new',
        'other',
      ]);
    });

    it('keeps the last ones only', () => {
      let recent = [];
      for (let i = 1; i <= MAX_RECENT_ADDRESSES + 2; i++) {
        recent = addRecentAddress(recent, address(i, i));
      }

      expect(recent).toHaveLength(MAX_RECENT_ADDRESSES);
      expect(recent[0].geometry.coordinates).toEqual([MAX_RECENT_ADDRESSES + 2, MAX_RECENT_ADDRESSES + 2]);
    });

    it('ignores an address without coordinates', () => {
      const recent = [address(1, 1)];

      expect(addRecentAddress(recent, { properties: {} })).toBe(recent);
    });
  });
});
