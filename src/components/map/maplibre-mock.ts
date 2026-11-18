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
  style: StyleSpecification;
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
  listeners = new Map<string, Listener[]>();
  dragRotate = handler();
  touchPitch = handler();
  keyboard = handler();
  touchZoomRotate = handler();

  constructor(options: { style: StyleSpecification; container: HTMLElement }) {
    if (!state.webgl) throw new Error('Failed to initialize WebGL');
    this.options = options;
    this.style = options.style;
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
    return id in this.data ? { setData: (data: unknown) => (this.data[id] = data) } : undefined;
  }
  getLayer(id: string) {
    return this.style.layers.find((layer) => layer.id === id);
  }
  setLayoutProperty(id: string, name: string, value: unknown) {
    (this.layout[id] ??= {})[name] = value;
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
  getContainer() {
    return this.container;
  }
  getPixelRatio() {
    return 1;
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
  setTerrain(terrain: unknown) {
    this.terrain = terrain;
  }
  setSky(sky: unknown) {
    this.sky = sky;
  }
  zoomIn() {}
  zoomOut() {}
  resize() {}
  stop() {}
  remove() {
    this.removed = true;
  }
}

export class FakeMarker {
  element?: HTMLElement;
  lngLat?: [number, number];
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
  addTo() {
    this.added = true;
    return this;
  }
  remove() {
    this.removed = true;
  }
}

export { FakeMap as Map, FakeMarker as Marker };
export class ScaleControl {}
export const setWorkerUrl = () => {};
export const addProtocol = vi.fn();
