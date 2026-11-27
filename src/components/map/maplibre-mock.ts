// MapLibre for the specs: it needs WebGL, which jsdom has not. A map that records what it is asked, as data the
// specs read: vi.mock('maplibre-gl', () => import('./maplibre-mock'))
import type { StyleSpecification } from 'maplibre-gl';
import { vi } from 'vitest';

type Listener = (event: Record<string, unknown>) => void;
type Bounds = [number, number, number, number];

export const state = {
  maps: [] as FakeMap[],
  markers: [] as FakeMarker[],
  // false: the map cannot be created, as without WebGL 2
  webgl: true,
  // the view of the maps created, in longitude, latitude
  extent: [6.7, 45.8, 6.9, 46.0] as Bounds,
};

export function resetMocks() {
  state.maps.length = 0;
  state.markers.length = 0;
  state.webgl = true;
  state.extent = [6.7, 45.8, 6.9, 46.0];
}

const handler = () => ({
  enabled: true,
  rotation: true,
  enable() {
    this.enabled = true;
  },
  disable() {
    this.enabled = false;
  },
  enableRotation() {
    this.rotation = true;
  },
  disableRotation() {
    this.rotation = false;
  },
});

export class FakeMap {
  // the style, as given then changed (addSource, addLayer...); addSprite is the one method of MapLibre's style used
  style: StyleSpecification & {
    addSprite(id: string, url: string, options: unknown, completion: () => void): void;
  };
  glyphs?: string | null;
  sprites = new Map<string, string>();
  container: HTMLElement;
  // the options the map was created with
  options: Record<string, unknown>;
  // the data of each GeoJSON source, as last set
  data: Record<string, unknown> = {};
  layout: Record<string, Record<string, unknown>> = {};
  paint: Record<string, Record<string, unknown>> = {};
  terrain: unknown = null;
  sky: unknown = null;
  images = new Set<string>();
  // the view, in longitude, latitude
  extent: Bounds = state.extent;
  zoom = 10;
  bearing = 0;
  pitch = 0;
  // what queryRenderedFeatures answers, and the layers it was asked
  rendered: Record<string, unknown>[] = [];
  queried: string[][] = [];
  cameras: Record<string, unknown>[] = [];
  removed = false;
  // the raster sources whose tiles were asked again (setTiles)
  reloaded: string[] = [];
  listeners = new Map<string, Listener[]>();
  dragRotate = handler();
  touchPitch = handler();
  keyboard = handler();
  touchZoomRotate = handler();

  constructor(options: { style: StyleSpecification; container: HTMLElement }) {
    if (!state.webgl) throw new Error('Failed to initialize WebGL');
    this.options = options;
    this.style = {
      ...options.style,
      layers: [...options.style.layers],
      sources: { ...options.style.sources },
      addSprite: (id, url, _options, completion) => {
        this.sprites.set(id, url);
        completion();
      },
    };
    this.container = options.container;
    for (const [id, source] of Object.entries(this.style.sources)) {
      if ('data' in source) this.data[id] = source.data;
    }
    state.maps.push(this);
    queueMicrotask(() => this.fire('load'));
  }

  on(type: string, listener: Listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
    return this;
  }

  once(type: string, listener: Listener) {
    const once: Listener = (event) => {
      this.listeners.set(
        type,
        (this.listeners.get(type) ?? []).filter((l) => l !== once)
      );
      listener(event);
    };
    return this.on(type, once);
  }

  off() {
    return this;
  }

  /** What the map would do on an event */
  fire(type: string, event: Record<string, unknown> = {}) {
    (this.listeners.get(type) ?? []).slice().forEach((listener) => listener(event));
  }

  addControl() {}
  getSource(id: string) {
    if (id in this.data) return { setData: (data: unknown) => (this.data[id] = data) };
    // a raster source: its tiles asked again
    return id in this.style.sources ? { setTiles: () => this.reloaded.push(id) } : undefined;
  }
  getLayer(id: string) {
    return this.style.layers.find((layer) => layer.id === id);
  }
  setLayoutProperty(id: string, name: string, value: unknown) {
    (this.layout[id] ??= {})[name] = value;
  }
  getLayoutProperty(id: string, name: string) {
    return this.layout[id]?.[name];
  }
  // a pixel is a thousandth of a degree
  unproject([x, y]: [number, number]) {
    return { lng: x / 1000, lat: y / 1000 };
  }
  project([lng, lat]: [number, number]) {
    return { x: lng * 1000, y: lat * 1000 };
  }
  setPaintProperty(id: string, name: string, value: unknown) {
    (this.paint[id] ??= {})[name] = value;
  }
  getBounds() {
    const [west, south, east, north] = this.extent;
    return {
      getWest: () => west,
      getSouth: () => south,
      getEast: () => east,
      getNorth: () => north,
      contains: ([lng, lat]: [number, number]) => lng >= west && lng <= east && lat >= south && lat <= north,
    };
  }
  getCenter() {
    return { lng: (this.extent[0] + this.extent[2]) / 2, lat: (this.extent[1] + this.extent[3]) / 2 };
  }
  getZoom() {
    return this.zoom;
  }
  getBearing() {
    return this.bearing;
  }
  getPitch() {
    return this.pitch;
  }
  getVerticalFieldOfView() {
    return 36.87;
  }
  getContainer() {
    return this.container;
  }
  // the flyover adapts them to the device (map-3d-quality.ts)
  pixelRatio = 1;
  lod: [number, number] | null = null;
  getPixelRatio() {
    return this.pixelRatio;
  }
  setPixelRatio(pixelRatio: number) {
    this.pixelRatio = pixelRatio;
  }
  setSourceTileLodParams(maxZoomLevelsOnScreen: number, tileCountMaxMinRatio: number) {
    this.lod = [maxZoomLevelsOnScreen, tileCountMaxMinRatio];
  }
  getCanvas() {
    return { getContext: () => null };
  }
  getLayersOrder() {
    return this.style.layers.map((layer) => layer.id);
  }
  getTerrain() {
    return this.terrain;
  }
  cameraForBounds([west, south, east, north]: Bounds) {
    // as close as it can for a point
    return { center: [(west + east) / 2, (south + north) / 2], zoom: west === east ? 22 : 12 };
  }
  jumpTo(camera: Record<string, unknown>) {
    this.cameras.push(camera);
    if (typeof camera.pitch === 'number') this.pitch = camera.pitch;
    if (typeof camera.zoom === 'number') this.zoom = camera.zoom;
  }
  easeTo(camera: Record<string, unknown>) {
    this.jumpTo(camera);
  }
  // a zoom button: a move of the user when it gives its event
  zoomIn(_options?: unknown, eventData: Record<string, unknown> = {}) {
    this.fire('movestart', eventData);
  }
  zoomOut(_options?: unknown, eventData: Record<string, unknown> = {}) {
    this.fire('movestart', eventData);
  }
  fitBounds(bounds: Bounds) {
    this.cameras.push({ bounds });
  }
  queryRenderedFeatures(_box: unknown, options: { layers: string[] }) {
    this.queried.push(options.layers);
    return this.rendered;
  }
  hasImage(id: string) {
    return this.images.has(id);
  }
  addImage(id: string) {
    this.images.add(id);
  }
  addSource(id: string, source: StyleSpecification['sources'][string]) {
    if (id in this.style.sources) throw new Error(`source ${id} already added`);
    this.style.sources[id] = source;
    if ('data' in source) this.data[id] = source.data;
  }
  removeSource(id: string) {
    if (this.style.layers.some((layer) => 'source' in layer && layer.source === id)) {
      throw new Error(`source ${id} still used`);
    }
    delete this.style.sources[id];
  }
  addLayer(layer: StyleSpecification['layers'][number], before?: string) {
    if (this.getLayer(layer.id)) throw new Error(`layer ${layer.id} already added`);
    const index = before ? this.style.layers.findIndex((l) => l.id === before) : -1;
    this.style.layers.splice(index < 0 ? this.style.layers.length : index, 0, layer);
  }
  removeLayer(id: string) {
    this.style.layers = this.style.layers.filter((layer) => layer.id !== id);
  }
  setGlyphs(glyphs: string | null) {
    this.glyphs = glyphs;
  }
  removeSprite(id: string) {
    this.sprites.delete(id);
  }
  setTerrain(terrain: unknown) {
    this.terrain = terrain;
  }
  setSky(sky: unknown) {
    this.sky = sky;
  }
  // the flyover: the terrain everywhere at `terrainElevation`, a camera looking from a point to another
  terrainElevation: number | null = 1000;
  centerElevation = 0;
  centerClampedToGround = true;
  queryTerrainElevation() {
    return this.terrain ? this.terrainElevation : null;
  }
  getCenterElevation() {
    return this.centerElevation;
  }
  getCenterClampedToGround() {
    return this.centerClampedToGround;
  }
  setCenterClampedToGround(clamped: boolean) {
    this.centerClampedToGround = clamped;
  }
  calculateCameraOptionsFromTo(
    from: { lng: number; lat: number },
    altitudeFrom: number,
    to: { lng: number; lat: number },
    altitudeTo = 0
  ) {
    const bearing = (Math.atan2(to.lng - from.lng, to.lat - from.lat) * 180) / Math.PI;
    return { center: [to.lng, to.lat], elevation: altitudeTo, zoom: 13, pitch: 60, bearing, altitudeFrom };
  }
  resize() {}
  stop() {}
  remove() {
    this.removed = true;
  }
}

export class FakeMarker {
  element?: HTMLElement;
  lngLat?: [number, number];
  rotation = 0;
  added = false;
  removed = false;

  constructor(options: { element?: HTMLElement } = {}) {
    this.element = options.element;
    state.markers.push(this);
  }
  setLngLat(lngLat: [number, number]) {
    this.lngLat = lngLat;
    return this;
  }
  getElement() {
    return this.element!;
  }
  setRotation(rotation: number) {
    this.rotation = rotation;
    return this;
  }
  addTo() {
    this.added = true;
    return this;
  }
  remove() {
    this.removed = true;
  }
}

export class LngLat {
  constructor(
    public lng: number,
    public lat: number
  ) {}
  static convert(value: LngLat | [number, number] | { lng: number; lat: number }) {
    return Array.isArray(value) ? new LngLat(value[0], value[1]) : new LngLat(value.lng, value.lat);
  }
}

export { FakeMap as Map, FakeMarker as Marker };
export class ScaleControl {}
export const setWorkerUrl = () => {};
export const addProtocol = vi.fn();
