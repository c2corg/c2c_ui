import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePartnerOutingsStore } from './partner-outings';

import service, { type PartnerOuting, type PartnerOutingsAnswer } from '@/js/apis/partner-outings-service';

vi.mock('@/js/apis/partner-outings-service', () => ({ default: { getAll: vi.fn() } }));

const getAll = vi.mocked(service.getAll);

const outing = (id: string, date: string) => ({ id, date, source: id.split(':')[0], title: id }) as PartnerOuting;
const answer = (items: PartnerOuting[], total = items.length): PartnerOutingsAnswer => ({
  total,
  items,
  sources: [{ source: 'skitour', status: 'ok', last_success_at: '2026-11-24T10:15:00+00:00' }],
});

// a request resolved by hand, rejecting with a cancellation when its signal is aborted
function deferred(signal?: AbortSignal) {
  let resolve!: (value: PartnerOutingsAnswer) => void;
  const promise = new Promise<PartnerOutingsAnswer>((res, rej) => {
    resolve = res;
    signal?.addEventListener('abort', () => rej(new axios.CanceledError()));
  });
  return { promise, resolve };
}

describe('partner outings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it('loads with the filters and the language', async () => {
    getAll.mockResolvedValue(answer([outing('skitour:1', '2026-11-23')], 57));
    const store = usePartnerOutingsStore();
    store.filters = { areas: [1, 2], activities: ['skitouring'], bbox: null };

    const loading = store.load('fr');
    expect(store.loading).toBe(true);
    await loading;

    expect(getAll).toHaveBeenCalledWith({ a: [1, 2], act: ['skitouring'], pl: 'fr' }, expect.any(AbortSignal));
    expect(store.loading).toBe(false);
    expect(store.items.map((item) => item.id)).toEqual(['skitour:1']);
    expect(store.total).toBe(57);
    expect(store.sources[0].source).toBe('skitour');
    expect(store.error).toBeNull();
  });

  it('never lets a stale answer overwrite the last load', async () => {
    const second = deferred();
    getAll.mockImplementationOnce((_query, signal) => deferred(signal).promise);
    getAll.mockReturnValueOnce(second.promise);
    const store = usePartnerOutingsStore();

    const stale = store.load('fr');
    const signal = getAll.mock.calls[0][1];
    const fresh = store.load('fr');
    expect(signal?.aborted).toBe(true);

    second.resolve(answer([outing('c2c:2', '2026-11-22')]));
    await Promise.all([fresh, stale]);

    expect(store.items.map((item) => item.id)).toEqual(['c2c:2']);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('ignores the answer of a request resolved after a newer one was started', async () => {
    const first = deferred();
    const second = deferred();
    getAll.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const store = usePartnerOutingsStore();

    const stale = store.load();
    const fresh = store.load();
    first.resolve(answer([outing('skitour:1', '2026-11-23')]));
    await stale;
    expect(store.items).toEqual([]);
    expect(store.loading).toBe(true);

    second.resolve(answer([outing('c2c:2', '2026-11-22')]));
    await fresh;
    expect(store.items.map((item) => item.id)).toEqual(['c2c:2']);
    expect(store.loading).toBe(false);
  });

  it('keeps the error, with no outings', async () => {
    const store = usePartnerOutingsStore();
    getAll.mockResolvedValueOnce(answer([outing('skitour:1', '2026-11-23')]));
    await store.load();

    const failure = new Error('503');
    getAll.mockRejectedValueOnce(failure);
    await store.load();

    expect(store.error).toBe(failure);
    expect(store.items).toEqual([]);
    expect(store.total).toBe(0);
    expect(store.loading).toBe(false);

    getAll.mockResolvedValueOnce(answer([]));
    await store.load();
    expect(store.error).toBeNull();
  });

  it('groups the outings by date, newest first, keeping the order of the API', async () => {
    getAll.mockResolvedValue(
      answer([
        outing('skitour:1', '2026-11-22'),
        outing('c2c:2', '2026-11-23'),
        outing('skitour:3', '2026-11-23'),
        outing('gulliver:4', '2026-11-21'),
        outing('c2c:5', '2026-11-23'),
      ])
    );
    const store = usePartnerOutingsStore();
    await store.load();

    expect(Object.keys(store.itemsByDate)).toEqual(['2026-11-23', '2026-11-22', '2026-11-21']);
    expect(store.itemsByDate['2026-11-23'].map((item) => item.id)).toEqual(['c2c:2', 'skitour:3', 'c2c:5']);
  });

  describe('route query', () => {
    it('reads a and act', () => {
      const store = usePartnerOutingsStore();
      store.fromRouteQuery({ a: '14295,14296', act: 'skitouring,snowshoeing' });

      expect(store.filters).toEqual({ areas: [14295, 14296], activities: ['skitouring', 'snowshoeing'], bbox: null });
    });

    it('drops what is not valid, and accepts repeated parameters', () => {
      const store = usePartnerOutingsStore();
      store.fromRouteQuery({ a: ['1', 'x', '-3', '2.5', ''], act: [null, 'skitouring'] });

      expect(store.filters).toEqual({ areas: [1], activities: ['skitouring'], bbox: null });
    });

    it('clears the filters when the query has none', () => {
      const store = usePartnerOutingsStore();
      store.filters = { areas: [1], activities: ['skitouring'], bbox: [1, 2, 3, 4] };
      store.fromRouteQuery({});

      expect(store.filters).toEqual({ areas: [], activities: [], bbox: null });
    });

    it('writes a and act, leaving out the empty filters', () => {
      const store = usePartnerOutingsStore();
      expect(store.toRouteQuery()).toEqual({});

      store.filters = { areas: [1, 2], activities: [], bbox: null };
      expect(store.toRouteQuery()).toEqual({ a: '1,2' });

      store.filters = { areas: [], activities: ['skitouring', 'snowshoeing'], bbox: null };
      expect(store.toRouteQuery()).toEqual({ act: 'skitouring,snowshoeing' });
    });

    it('reads and writes the extent of the map (bbox, EPSG:3857), when it is four increasing numbers', () => {
      const store = usePartnerOutingsStore();
      store.fromRouteQuery({ bbox: '700000,5700000,800000,5800000' });
      expect(store.filters.bbox).toEqual([700000, 5700000, 800000, 5800000]);
      expect(store.toRouteQuery()).toEqual({ bbox: '700000,5700000,800000,5800000' });

      for (const bad of ['1,2,3', 'a,b,c,d', '5,5,1,1', '']) {
        store.fromRouteQuery({ bbox: bad });
        expect(store.filters.bbox).toBeNull();
      }
    });

    it('sends the extent to the API', async () => {
      getAll.mockResolvedValue(answer([], 0));
      const store = usePartnerOutingsStore();
      store.filters = { areas: [], activities: [], bbox: [1, 2, 3, 4] };
      await store.load();
      expect(getAll).toHaveBeenCalledWith(expect.objectContaining({ bbox: [1, 2, 3, 4] }), expect.any(AbortSignal));
    });

    it('round-trips', () => {
      const store = usePartnerOutingsStore();
      const query = { a: '14295,14296', act: 'skitouring' };
      store.fromRouteQuery(query);

      expect(store.toRouteQuery()).toEqual(query);
    });
  });
});
