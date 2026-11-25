import { afterEach, describe, expect, it, vi } from 'vitest';

import service, { type PartnerOutingsAnswer } from './partner-outings-service';

const answer: PartnerOutingsAnswer = { total: 0, items: [], sources: [] };

describe('partner outings service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends arrays comma separated, with the language and the paging', async () => {
    const get = vi.spyOn(service.axios, 'get').mockResolvedValue({ data: answer });

    await service.getAll({
      a: [14295, 14296],
      act: ['skitouring'],
      date: '2026-11-01,2026-11-20',
      sources: ['skitour', 'c2c'],
      limit: 50,
      offset: 100,
      pl: 'fr',
    });

    expect(get).toHaveBeenCalledWith('/partner-outings', {
      params: {
        a: '14295,14296',
        act: 'skitouring',
        date: '2026-11-01,2026-11-20',
        sources: 'skitour,c2c',
        limit: 50,
        offset: 100,
        pl: 'fr',
      },
      signal: undefined,
    });
  });

  it('leaves out the empty filters', async () => {
    const get = vi.spyOn(service.axios, 'get').mockResolvedValue({ data: answer });

    await service.getAll({ a: [], act: [], sources: [], date: '', pl: 'en' });
    await service.getAll({});

    expect(get.mock.calls.map(([, config]) => config?.params)).toEqual([{ pl: 'en' }, {}]);
  });

  it('keeps a zero offset', () => {
    expect(service.params({ offset: 0 })).toEqual({ offset: 0 });
  });

  it('joins the extent, and leaves out one that is not four numbers', () => {
    expect(service.params({ bbox: [1, 2, 3, 4] })).toEqual({ bbox: '1,2,3,4' });
    expect(service.params({ bbox: [] })).toEqual({});
    expect(service.params({ steep: true, sources: ['c2c', 'skitour'] })).toEqual({
      steep: 'true',
      sources: 'c2c,skitour',
    });
    expect(service.params({ steep: false })).toEqual({ steep: 'false' });
    expect(service.params({ steep: undefined, sources: [] })).toEqual({});
  });

  it('passes the abort signal and returns the answer', async () => {
    const get = vi.spyOn(service.axios, 'get').mockResolvedValue({ data: answer });
    const { signal } = new AbortController();

    await expect(service.getAll({}, signal)).resolves.toBe(answer);
    expect(get.mock.calls[0][1]?.signal).toBe(signal);
  });

  it('reads the health of the sources', async () => {
    const rows = [
      {
        source: 'skitour',
        status: 'degraded',
        last_success_at: null,
        site_name: 'skitour.fr',
        last_skipped: { too_old: 1 },
      },
    ];
    const get = vi.spyOn(service.axios, 'get').mockResolvedValue({ data: { sources: rows } });
    const { signal } = new AbortController();

    await expect(service.getSources(signal)).resolves.toEqual(rows);
    expect(get).toHaveBeenCalledWith('/partner-outings/sources', { signal });
  });

  it('rejects when the API fails', async () => {
    vi.spyOn(service.axios, 'get').mockRejectedValue(new Error('503'));

    await expect(service.getAll({})).rejects.toThrow('503');
  });
});
