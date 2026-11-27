import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MAX_RECENT_ADDRESSES,
  addRecentAddress,
  buildTransportQuery,
  formatTransportFrom,
  hasTransportQuery,
  parseTransportQuery,
  roundTime,
  transportDateRange,
  transportDatesError,
  transportSearchKey,
  withoutTransportQuery,
  type AddressSelection,
  type ParsedTransportSearch,
} from './transport-query';

// a search read from the url, which the tests know is complete
const parse = (query: Parameters<typeof parseTransportQuery>[0]) => parseTransportQuery(query) as ParsedTransportSearch;

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
      expect(formatTransportFrom({ properties: {} } as AddressSelection)).toBeNull();
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

    it('has a return date only for a return another day than the departure', () => {
      expect(buildTransportQuery({ ...search, returnDate: '2026-01-18' }).transport_return_date).toBe('2026-01-18');
      expect(buildTransportQuery({ ...search, returnDate: '2026-01-16' })).not.toHaveProperty('transport_return_date');
      expect(buildTransportQuery({ ...search, returnDate: '' })).not.toHaveProperty('transport_return_date');
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
        returnDate: null,
        minDeparture: '08:00',
        maxReturn: '18:00',
        maxDuration: 90,
        hikingDuration: 60,
      });
    });

    it('reads the return date of a trip of several days, but not a return the same day', () => {
      expect(parse(buildTransportQuery({ ...search, returnDate: '2026-01-18' })).returnDate).toBe('2026-01-18');
      expect(parse({ ...buildTransportQuery(search), transport_return_date: '2026-01-16' }).returnDate).toBeNull();
    });

    it('gives null for the optional durations that are missing or invalid', () => {
      const parsed = parse({ ...buildTransportQuery(search), transport_max_duration: 'abc' });

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

      expect(parse(query).date).toBe('2026-02-01');
    });
  });

  it('detects the transport search of a query', () => {
    expect(hasTransportQuery(buildTransportQuery(search))).toBe(true);
    expect(hasTransportQuery({ act: 'hiking' })).toBe(false);
  });

  it('identifies a search', () => {
    const parsed = parse(buildTransportQuery(search));

    expect(transportSearchKey(parsed)).toBe(transportSearchKey({ ...parsed }));
    expect(transportSearchKey(parsed)).not.toBe(transportSearchKey({ ...parsed, maxReturn: '19:00' }));
    expect(transportSearchKey(parsed)).not.toBe(transportSearchKey({ ...parsed, returnDate: '2026-01-18' }));
    // a return the same day is no return date
    expect(transportSearchKey(parsed)).toBe(transportSearchKey({ ...parsed, returnDate: parsed.date }));
  });

  describe('transportDatesError', () => {
    // the dates of the tests are within 6 months
    beforeEach(() => {
      vi.useFakeTimers({ now: new Date(2026, 0, 10, 12) });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('refuses a date out of the next 6 months', () => {
      expect(transportDatesError({ ...dates, date: '2026-01-09' })).toBe('date-out-of-range');
      expect(transportDatesError({ ...dates, returnDate: '2026-07-11' })).toBe('date-out-of-range');
      expect(transportDatesError({ ...dates, returnDate: '2026-07-10' })).toBeNull();
    });

    const dates = { date: '2026-01-16', minDeparture: '08:00', maxReturn: '18:00' };

    it('accepts a return the same day, after the departure', () => {
      expect(transportDatesError(dates)).toBeNull();
      expect(transportDatesError({ ...dates, returnDate: '2026-01-16' })).toBeNull();
    });

    it('refuses a return time that is not after the departure time, for a return the same day', () => {
      expect(transportDatesError({ ...dates, maxReturn: '07:00' })).toBe('return-time-before-departure-time');
      expect(transportDatesError({ ...dates, maxReturn: '08:00', returnDate: '' })).toBe(
        'return-time-before-departure-time'
      );
    });

    it('does not compare the times for a return another day', () => {
      expect(transportDatesError({ ...dates, maxReturn: '07:00', returnDate: '2026-01-17' })).toBeNull();
    });

    it('refuses a return date before the departure date', () => {
      expect(transportDatesError({ ...dates, returnDate: '2026-01-15' })).toBe('return-before-departure');
    });
  });

  it('removes the transport parameters and only them', () => {
    const query = { act: 'hiking', offset: '30', ...buildTransportQuery(search) };

    expect(withoutTransportQuery(query)).toEqual({ act: 'hiking', offset: '30' });
  });

  describe('addRecentAddress', () => {
    const address = (lon: number, lat: number, name = ''): AddressSelection => ({
      geometry: { coordinates: [lon, lat] },
      properties: { name },
    });

    it('puts the new address first', () => {
      expect(addRecentAddress([address(1, 1, 'a')], address(2, 2, 'b')).map((a) => a.properties!.name)).toEqual([
        'b',
        'a',
      ]);
    });

    it('does not keep the same starting point twice', () => {
      const recent = [address(5.1001, 45.1001, 'old'), address(2, 2, 'other')];

      expect(addRecentAddress(recent, address(5.1003, 45.1002, 'new')).map((a) => a.properties!.name)).toEqual([
        'new',
        'other',
      ]);
    });

    it('keeps the last ones only', () => {
      let recent: AddressSelection[] = [];
      for (let i = 1; i <= MAX_RECENT_ADDRESSES + 2; i++) {
        recent = addRecentAddress(recent, address(i, i));
      }

      expect(recent).toHaveLength(MAX_RECENT_ADDRESSES);
      expect(recent[0].geometry!.coordinates).toEqual([MAX_RECENT_ADDRESSES + 2, MAX_RECENT_ADDRESSES + 2]);
    });

    it('ignores an address without coordinates', () => {
      const recent = [address(1, 1)];

      expect(addRecentAddress(recent, { properties: {} })).toBe(recent);
    });
  });

  describe('roundTime', () => {
    it('rounds a departure up and a return down to the quarter hour', () => {
      expect(roundTime('07:40', 'up')).toBe('07:45');
      expect(roundTime('07:45', 'up')).toBe('07:45');
      expect(roundTime('19:10', 'down')).toBe('19:00');
      expect(roundTime('7:05', 'down')).toBe('07:00');
    });

    it('stays within the day', () => {
      expect(roundTime('23:50', 'up')).toBe('23:45');
    });
  });

  it('rounds the times of the query, also of the links made before', () => {
    const query = buildTransportQuery({ ...search, minDeparture: '08:05', maxReturn: '17:55' });
    expect(query.transport_min_departure).toBe('08:15');
    expect(query.transport_max_return).toBe('17:45');

    const parsed = parse({ ...buildTransportQuery(search), transport_min_departure: '08:05' });
    expect(parsed.minDeparture).toBe('08:15');
  });

  it('limits the dates to the next 6 months', () => {
    expect(transportDateRange(new Date(2026, 10, 27))).toEqual({ min: '2026-11-27', max: '2027-05-27' });
    // the last day of a shorter month
    expect(transportDateRange(new Date(2026, 7, 31)).max).toBe('2027-02-28');
  });
});
