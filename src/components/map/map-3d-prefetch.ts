// the tiles of the flyover (MapFlyover.vue), fetched before the camera gets there: the browser keeps them in its HTTP
// cache, where MapLibre finds them when it asks for them. The tiles of a camera are those MapLibre would load for it:
// coveringTiles on a copy of the transform of the map, moved to that camera.
import { type CameraOptions, LngLat, type Map as MapLibreMap, type OverscaledTileID } from 'maplibre-gl';

import { NO_BLANK } from './map-layers';

/** A tile to fetch, needed when the camera is at the distance `at` along the track; plain: asked as fetch() does */
export type TileRequest = { url: string; at: number; plain?: boolean };
export type TileUrl = Omit<TileRequest, 'at'>;

// what coveringTiles reads of a source (RasterTileSource, RasterDEMTileSource)
type TiledSource = {
  tiles?: string[];
  tileSize: number;
  minzoom: number;
  maxzoom: number;
  roundZoom?: boolean;
  scheme?: string;
  hasTile?: (tileID: OverscaledTileID) => boolean;
  calculateTileZoom?: unknown;
};
export type PrefetchSource = { source: TiledSource; terrain: boolean };

// the transform of MapLibre: not exported, the part used here
type Transform = {
  clone(): Transform;
  setCenter(center: LngLat): void;
  setZoom(zoom: number): void;
  setBearing(bearing: number): void;
  setPitch(pitch: number): void;
  setElevation(elevation: number): void;
};

const RASTER_LAYERS = new Set(['raster', 'hillshade', 'color-relief']);

/** The sources of the tiles the map draws now: the visible raster layers, and the terrain */
export function visibleTileSources(map: MapLibreMap): PrefetchSource[] {
  const ids = new Map<string, boolean>();
  for (const id of map.getLayersOrder()) {
    const layer = map.getLayer(id);
    if (!layer?.source || !RASTER_LAYERS.has(layer.type) || map.getLayoutProperty(id, 'visibility') === 'none')
      continue;
    ids.set(layer.source, false);
  }
  const terrain = map.getTerrain()?.source;
  if (terrain) ids.set(terrain, true);
  return [...ids]
    .map(([id, terrain]) => ({ source: map.getSource(id) as unknown as TiledSource | undefined, terrain }))
    .filter((entry): entry is PrefetchSource => !!entry.source?.tiles?.length);
}

/** The URLs of the tiles MapLibre would load for this camera, null when the map does not allow it to be known */
export function tileUrls(map: MapLibreMap, camera: CameraOptions, sources: PrefetchSource[]): TileUrl[] | null {
  const current = (map as unknown as { _camera?: { transform?: Transform } })._camera?.transform;
  if (!current?.clone || !camera.center || camera.zoom === undefined) return null;
  const transform = current.clone();
  transform.setZoom(camera.zoom);
  transform.setCenter(LngLat.convert(camera.center));
  transform.setBearing(camera.bearing ?? 0);
  transform.setPitch(camera.pitch ?? 0);
  if (camera.elevation !== undefined) transform.setElevation(camera.elevation);
  const terrain = (map as unknown as { terrain?: unknown }).terrain;
  const pixelRatio = map.getPixelRatio();
  const urls: TileUrl[] = [];
  for (const { source, terrain: forTerrain } of sources) {
    // as the tile manager of MapLibre asks them (TileManager.update)
    const ids = map.coveringTiles.call({ _camera: { transform } }, {
      tileSize: source.tileSize,
      minzoom: source.minzoom,
      maxzoom: source.maxzoom,
      roundZoom: forTerrain ? false : source.roundZoom,
      terrain,
      calculateTileZoom: source.calculateTileZoom,
    } as Parameters<MapLibreMap['coveringTiles']>[0]);
    for (const id of ids) {
      if (source.hasTile && !source.hasTile(id)) continue;
      const url = id.canonical.url(source.tiles!, pixelRatio, source.scheme);
      // the tiles of the protocol of map-3d-layers.ts: it fetches them over https, as fetch() does
      urls.push(
        url.startsWith(`${NO_BLANK}://`) ? { url: url.replace(`${NO_BLANK}://`, 'https://'), plain: true } : { url }
      );
    }
  }
  return urls;
}

/**
 * A tile in the HTTP cache: asked as MapLibre asks it (the accept header of its images, which a server may vary on),
 * and read to the end
 */
export async function fetchTile({ url, plain }: TileRequest, signal: AbortSignal, urgent: boolean): Promise<void> {
  const response = await fetch(url, {
    signal,
    ...(plain ? {} : { headers: { accept: 'image/webp,*/*' } }),
    priority: urgent ? 'auto' : 'low',
  });
  await response.arrayBuffer();
}

/**
 * The tiles of the cameras ahead, fetched in the order of the track, a few at a time, from the camera to a horizon: not
 * the whole track at once, the tiles behind the camera dropped
 */
export class TilePrefetcher {
  private queue: TileRequest[] = [];
  private seen = new Set<string>();
  private inFlight = new Set<TileRequest>();
  private position = 0;
  private horizon = Infinity;
  private urgentUntil = -Infinity;
  private controller = new AbortController();
  private waiters: { at: number; resolve: () => void }[] = [];
  loaded = 0;
  failed = 0;

  constructor(
    private readonly fetchTile: (request: TileRequest, signal: AbortSignal, urgent: boolean) => Promise<unknown>,
    private readonly concurrency = 6
  ) {}

  /** Tiles to fetch; those already asked are not asked again */
  add(requests: TileRequest[]): void {
    const added = requests.filter(({ url }) => !this.seen.has(url));
    if (!added.length) return;
    added.forEach(({ url }) => this.seen.add(url));
    this.queue.push(...added);
    this.queue.sort((a, b) => a.at - b.at);
    this.pump();
  }

  /** The camera is at `position`: the tiles up to `horizon` are fetched, those before `urgentUntil` first */
  window(position: number, horizon: number, urgentUntil = -Infinity): void {
    this.position = position;
    this.horizon = horizon;
    this.urgentUntil = urgentUntil;
    this.pump();
  }

  /** When the tiles asked up to `at` are fetched, or after `timeout` milliseconds */
  ready(at: number, timeout: number): Promise<void> {
    if (!this.pendingUntil(at) || timeout <= 0) return Promise.resolve();
    return new Promise((resolve) => {
      const waiter = { at, resolve };
      this.waiters.push(waiter);
      setTimeout(() => this.release(waiter), timeout);
    });
  }

  /** The tiles asked and not fetched yet, in the queue and in flight */
  get pending(): number {
    return this.queue.length + this.inFlight.size;
  }

  stop(): void {
    this.controller.abort();
    this.queue = [];
    this.waiters.forEach(({ resolve }) => resolve());
    this.waiters = [];
  }

  private pendingUntil(at: number): boolean {
    return this.queue.some((request) => request.at <= at) || [...this.inFlight].some((request) => request.at <= at);
  }

  private release(waiter: { at: number; resolve: () => void }): void {
    this.waiters = this.waiters.filter((other) => other !== waiter);
    waiter.resolve();
  }

  private pump(): void {
    if (this.controller.signal.aborted) return;
    // behind the camera: no longer needed
    while (this.queue.length && this.queue[0].at < this.position) this.queue.shift();
    while (this.inFlight.size < this.concurrency && this.queue.length && this.queue[0].at <= this.horizon) {
      const request = this.queue.shift()!;
      this.inFlight.add(request);
      this.fetchTile(request, this.controller.signal, request.at <= this.urgentUntil)
        .then(
          () => this.loaded++,
          () => this.failed++
        )
        .finally(() => {
          this.inFlight.delete(request);
          this.waiters.filter(({ at }) => !this.pendingUntil(at)).forEach((waiter) => this.release(waiter));
          this.pump();
        });
    }
    this.waiters.filter(({ at }) => !this.pendingUntil(at)).forEach((waiter) => this.release(waiter));
  }
}
