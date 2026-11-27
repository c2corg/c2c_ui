import { AxiosError, type AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import avalancheBulletins from './avalanche-bulletin-service';

const failure = (status: number) =>
  new AxiosError('failed', String(status), undefined, undefined, { status } as AxiosResponse);

describe('avalanche bulletin service', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fetches the bulletins of a region for a day, in the language of the API', async () => {
    const get = vi.spyOn(avalancheBulletins.axios, 'get').mockResolvedValue({ data: { bulletins: [{ id: 1 }] } });
    const signal = new AbortController().signal;

    expect(await avalancheBulletins.getBulletinsOfDay('FR-03', '2026-11-24', 'fr', signal)).toEqual([{ id: 1 }]);
    expect(get).toHaveBeenCalledWith('/avalanche-bulletins/regions/FR-03/2026-11-24', {
      params: { lang: 'fr' },
      signal,
    });

    await avalancheBulletins.getBulletinsOfDay('FR-03', '2026-11-24', 'xx');
    expect(get).toHaveBeenLastCalledWith('/avalanche-bulletins/regions/FR-03/2026-11-24', {
      params: {},
      signal: undefined,
    });
  });

  it('gives no bulletin when none is stored for the day (404), fails on other errors', async () => {
    const get = vi.spyOn(avalancheBulletins.axios, 'get').mockRejectedValue(failure(404));
    expect(await avalancheBulletins.getBulletinsOfDay('FR-03', '2020-01-01')).toEqual([]);

    get.mockRejectedValue(failure(500));
    await expect(avalancheBulletins.getBulletinsOfDay('FR-03', '2020-01-01')).rejects.toThrow('failed');
  });
});
