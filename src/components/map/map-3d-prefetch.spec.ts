import type { Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, it, vi } from 'vitest';

import { TilePrefetcher, tileUrls, visibleTileSources, type TileRequest } from './map-3d-prefetch';
import { NO_BLANK } from './map-layers';

// a fetch answered by the test, one tile at a time
function deferredFetch() {
  const asked: { request: TileRequest; urgent: boolean; resolve: () => void; reject: () => void }[] = [];
  const fetchTile = vi.fn(
    (request: TileRequest, _signal: AbortSignal, urgent: boolean) =>
      new Promise<void>((resolve, reject) => asked.push({ request, urgent, resolve, reject }))
  );
  return { asked, fetchTile };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('TilePrefetcher', () => {
  it('fetches in the order of the track, a few at a time, up to the horizon', async () => {
    const { asked, fetchTile } = deferredFetch();
    const prefetcher = new TilePrefetcher(fetchTile, 2);
    prefetcher.window(0, 100);
    prefetcher.add([
      { url: 'c', at: 50 },
      { url: 'a', at: 0 },
      { url: 'far', at: 500 },
      { url: 'b', at: 10 },
    ]);
    expect(asked.map(({ request }) => request.url)).toEqual(['a', 'b']);
    asked[0].resolve();
    await tick();
    expect(asked.map(({ request }) => request.url)).toEqual(['a', 'b', 'c']);
    asked[1].resolve();
    asked[2].reject();
    await tick();
    // beyond the horizon: not yet
    expect(asked).toHaveLength(3);
    expect(prefetcher.loaded).toBe(2);
    expect(prefetcher.failed).toBe(1);
    prefetcher.window(450, 600);
    expect(asked.map(({ request }) => request.url)).toEqual(['a', 'b', 'c', 'far']);
  });

  it('asks a tile once, and drops those behind the camera', () => {
    const { asked, fetchTile } = deferredFetch();
    const prefetcher = new TilePrefetcher(fetchTile, 1);
    prefetcher.add([
      { url: 'a', at: 0 },
      { url: 'b', at: 10 },
      { url: 'c', at: 20 },
    ]);
    prefetcher.add([{ url: 'a', at: 30 }]);
    expect(prefetcher.pending).toBe(3);
    // a seek: b is no longer needed
    prefetcher.window(15, Infinity);
    asked[0].resolve();
    expect(prefetcher.pending).toBe(2);
    expect(asked.map(({ request }) => request.url)).toEqual(['a']);
  });

  it('marks the tiles of the first seconds urgent', () => {
    const { asked, fetchTile } = deferredFetch();
    const prefetcher = new TilePrefetcher(fetchTile, 4);
    prefetcher.window(0, 100, 10);
    prefetcher.add([
      { url: 'a', at: 0 },
      { url: 'b', at: 50 },
    ]);
    expect(asked.map(({ urgent }) => urgent)).toEqual([true, false]);
  });

  it('is ready when the tiles up to a distance are fetched, or after a timeout', async () => {
    vi.useFakeTimers();
    try {
      const { asked, fetchTile } = deferredFetch();
      const prefetcher = new TilePrefetcher(fetchTile, 4);
      prefetcher.add([
        { url: 'a', at: 0 },
        { url: 'b', at: 10 },
        { url: 'c', at: 90 },
      ]);
      let ready = false;
      void prefetcher.ready(20, 3000).then(() => (ready = true));
      asked[0].resolve();
      await vi.advanceTimersByTimeAsync(0);
      expect(ready).toBe(false);
      asked[1].resolve();
      await vi.advanceTimersByTimeAsync(0);
      // c, farther, may still load
      expect(ready).toBe(true);

      let late = false;
      void prefetcher.ready(100, 3000).then(() => (late = true));
      await vi.advanceTimersByTimeAsync(2999);
      expect(late).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(late).toBe(true);
      // no time left: at once
      await expect(prefetcher.ready(100, 0)).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops: aborts what is in flight and asks nothing more', () => {
    const { asked, fetchTile } = deferredFetch();
    const prefetcher = new TilePrefetcher(fetchTile, 1);
    prefetcher.add([
      { url: 'a', at: 0 },
      { url: 'b', at: 10 },
    ]);
    const signal = fetchTile.mock.calls[0][1];
    prefetcher.stop();
    expect(signal.aborted).toBe(true);
    prefetcher.add([{ url: 'c', at: 0 }]);
    expect(asked).toHaveLength(1);
  });
});

describe('tileUrls', () => {
  // the transform of MapLibre, as far as the camera goes
  const transform = () => {
    const state: Record<string, unknown> = {};
    const self = {
      state,
      clone: () => self,
      setCenter: (center: { lng: number; lat: number }) => (state.center = [center.lng, center.lat]),
      setZoom: (zoom: number) => (state.zoom = zoom),
      setBearing: (bearing: number) => (state.bearing = bearing),
      setPitch: (pitch: number) => (state.pitch = pitch),
      setElevation: (elevation: number) => (state.elevation = elevation),
    };
    return self;
  };

  it('lists the tiles MapLibre would load for a camera, the protocol of the orthophotos fetched over https', () => {
    const moved = transform();
    const coveringTiles = vi.fn(function (this: { _camera: { transform: unknown } }, options: { tileSize: number }) {
      expect(this._camera.transform).toBe(moved);
      const z = options.tileSize === 512 ? 12 : 13;
      return [{ canonical: { url: (tiles: string[]) => tiles[0].replace('{z}', String(z)) } }];
    });
    const map = {
      _camera: { transform: { clone: () => moved } },
      coveringTiles,
      getPixelRatio: () => 2,
      terrain: 'terrain',
    } as unknown as MapLibreMap;
    const urls = tileUrls(map, { center: [6.8, 45.9], zoom: 12.4, bearing: 30, pitch: 60, elevation: 2000 }, [
      { source: { tiles: [`${NO_BLANK}://ortho/{z}.jpeg`], tileSize: 256, minzoom: 0, maxzoom: 19 }, terrain: false },
      { source: { tiles: ['https://dem/{z}.webp'], tileSize: 512, minzoom: 0, maxzoom: 14 }, terrain: true },
    ]);
    expect(moved.state).toEqual({ center: [6.8, 45.9], zoom: 12.4, bearing: 30, pitch: 60, elevation: 2000 });
    expect(urls).toEqual([{ url: 'https://ortho/13.jpeg', plain: true }, { url: 'https://dem/12.webp' }]);
    expect(coveringTiles.mock.calls[1][0]).toMatchObject({ tileSize: 512, roundZoom: false, terrain: 'terrain' });
  });

  it('is null without a transform to copy', () => {
    expect(tileUrls({} as MapLibreMap, { center: [6.8, 45.9], zoom: 12 }, [])).toBeNull();
  });
});

describe('visibleTileSources', () => {
  it('takes the visible raster layers and the terrain', () => {
    const sources: Record<string, unknown> = {
      ortho: { tiles: ['o'] },
      hidden: { tiles: ['h'] },
      dem: { tiles: ['d'] },
      lines: { type: 'geojson' },
    };
    const layers: Record<string, { type: string; source: string }> = {
      ortho: { type: 'raster', source: 'ortho' },
      hidden: { type: 'raster', source: 'hidden' },
      shading: { type: 'hillshade', source: 'dem' },
      track: { type: 'line', source: 'lines' },
    };
    const map = {
      getLayersOrder: () => Object.keys(layers),
      getLayer: (id: string) => layers[id],
      getLayoutProperty: (id: string) => (id === 'hidden' ? 'none' : 'visible'),
      getTerrain: () => ({ source: 'dem' }),
      getSource: (id: string) => sources[id],
    } as unknown as MapLibreMap;
    expect(visibleTileSources(map)).toEqual([
      { source: sources.ortho, terrain: false },
      { source: sources.dem, terrain: true },
    ]);
  });
});
