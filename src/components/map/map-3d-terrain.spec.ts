import { afterEach, describe, expect, it, vi } from 'vitest';

import { getTerrainTile, sampleTerrain, terrainSource } from './map-3d-terrain';

const TILES = 'https://media.camptocamp.org/c2corg-dem/tiles/mapterhorn-0.0.13';

describe('terrain', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks MapLibre for the tiles served by HAProxy', () => {
    expect(terrainSource.tiles).toEqual([`${TILES}/{z}/{x}/{y}.webp`]);
    expect(terrainSource.encoding).toBe('terrarium');
  });

  it('reads a tile', async () => {
    const data = new ArrayBuffer(8);
    const fetch = vi.fn().mockResolvedValue({ status: 200, ok: true, arrayBuffer: () => Promise.resolve(data) });
    vi.stubGlobal('fetch', fetch);
    await expect(getTerrainTile(12, 2125, 1459)).resolves.toBe(data);
    expect(fetch.mock.calls[0][0]).toBe(`${TILES}/12/2125/1459.webp`);
  });

  it('has no tile where the zoom has none (404)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404, ok: false }));
    await expect(getTerrainTile(14, 0, 0)).resolves.toBeUndefined();
  });

  it('gives up a tile that does not come, as one that failed: no wait without end for the terrain', async () => {
    const timeouts: AbortController[] = [];
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
      const controller = new AbortController();
      timeouts.push(controller);
      return controller.signal;
    });
    // never answers, but to an abort
    const fetch = vi.fn(
      (_url: string, { signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason)))
    );
    vi.stubGlobal('fetch', fetch);
    const sampled = sampleTerrain([[-170.5, -80.5]], 2);
    await vi.waitFor(() => expect(timeouts).toHaveLength(1));
    // the tile at its zoom, then its parents, each given up in turn
    for (let zoom = 2; zoom >= 0; zoom--) {
      await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3 - zoom));
      timeouts.at(-1)!.abort();
    }
    expect(Array.from(await sampled)).toEqual([NaN]);
    vi.restoreAllMocks();
  });

  it('fails on another error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 403, ok: false }));
    await expect(getTerrainTile(12, 0, 0)).rejects.toThrow('403');
  });
});
