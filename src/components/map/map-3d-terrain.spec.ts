import { afterEach, describe, expect, it, vi } from 'vitest';

import { getTerrainTile, terrainSource } from './map-3d-terrain';

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

  it('fails on another error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 403, ok: false }));
    await expect(getTerrainTile(12, 0, 0)).rejects.toThrow('403');
  });
});
