<template>
  <div ref="rootElement" class="map-3d">
    <div ref="mapElement" class="map-3d-canvas" @click="showLayerSwitcher = false" />

    <!-- the controls of the 2D map: same classes, places and look -->
    <div class="ol-zoom ol-unselectable ol-control">
      <button class="ol-zoom-in" type="button" :title="$gettext('Zoom in', 'Map controls')" @click="map?.zoomIn()">
        +
      </button>
      <button class="ol-zoom-out" type="button" :title="$gettext('Zoom out', 'Map controls')" @click="map?.zoomOut()">
        –
      </button>
    </div>

    <div class="ol-full-screen ol-unselectable ol-control">
      <button type="button" :title="$gettext('Toggle full-screen', 'Map Controls')" @click="toggleFullscreen">
        <fa-icon :icon="isFullscreen ? 'compress' : 'expand'" />
      </button>
    </div>

    <div class="ol-control map-3d-compass" :title="$gettext('North up', 'Map controls')">
      <button type="button" :aria-label="$gettext('North up', 'Map controls')" @click="resetNorth">
        <span class="map-3d-compass-needle" :style="{ transform: `rotate(${-bearing}deg)` }">▲</span>
      </button>
    </div>

    <div class="ol-control ol-control-layer-switcher-button" :title="$gettext('Layers', 'Map controls')">
      <button :aria-label="$gettext('Layers', 'Map controls')" @click.stop="showLayerSwitcher = !showLayerSwitcher">
        <fa-icon icon="layer-group" />
      </button>
    </div>

    <div class="ol-control map-3d-2d-button" title="2D">
      <button type="button" aria-label="2D" @click="$emit('close')"><span>2D</span></button>
    </div>

    <!-- the OpenLayers attribution control, as in the 2D map: the credits of the visible layers, collapsed at first -->
    <div class="ol-attribution ol-unselectable ol-control" :class="{ 'ol-collapsed': attributionCollapsed }">
      <button
        type="button"
        :title="$gettext('Attributions', 'Map controls')"
        :aria-expanded="!attributionCollapsed"
        @click="attributionCollapsed = !attributionCollapsed"
      >
        <span v-if="attributionCollapsed" class="ol-attribution-expand">i</span>
        <span v-else class="ol-attribution-collapse">›</span>
      </button>
      <ul>
        <!-- eslint-disable-next-line vue/no-v-html: our own constants (map-3d-layers.ts, map-3d-terrain.ts) -->
        <li v-for="attribution of attributions" :key="attribution" v-html="attribution" />
      </ul>
    </div>

    <div v-show="showLayerSwitcher" class="ol-control ol-control-layer-switcher" @click.stop="">
      <div class="ol-control-layer-switcher-layers">
        <header v-translate>Base layer</header>
        <div class="layer-group">
          <layer-button
            v-for="layer of baseLayers"
            :key="layer.title"
            :layer="layer"
            :selected="layer.title === base"
            title-context="Map layer"
            @click="base = layer.title"
          />
        </div>
        <header v-translate>Slopes</header>
        <div class="layer-group">
          <layer-button
            v-for="layer of slopeLayers"
            :key="layer.title"
            :layer="layer"
            :selected="slopes.includes(layer.title)"
            title-context="Map slopes layer"
            @click="toggleSlope(layer.title)"
          />
        </div>
        <header v-translate>Terrain</header>
        <div class="layer-group">
          <layer-button
            :layer="shadingButton"
            :selected="shading"
            title-context="Map layer"
            @click="shading = !shading"
          />
        </div>
      </div>
      <button
        type="button"
        class="ol-control-layer-switcher-close"
        :title="$gettext('Close')"
        :aria-label="$gettext('Close')"
        @click.stop="showLayerSwitcher = false"
      >
        <fa-icon icon="chevron-left" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// a 3D view of the 2D map (same place and documents), on MapLibre and our terrain tiles (map-3d-terrain.ts).
// MapLibre is only downloaded when this component is first shown: OlMap imports it asynchronously on the 3D click.
import type { FeatureCollection } from 'geojson';
import {
  type GeoJSONSource,
  Map as MapLibreMap,
  Marker,
  type RasterSourceSpecification,
  ScaleControl,
  setWorkerUrl,
} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { toLonLat } from 'ol/proj';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch, type PropType } from 'vue';
import { useRouter } from 'vue-router';

import LayerButton from './LayerButton.vue';
import {
  addFlightLayers,
  findFlights,
  hasParaglidingTrack,
  loadFlightLayers,
  withoutParaglidingTracks,
} from './map-3d-flight-layers';
import {
  type Layer3d,
  orthoLayerAt,
  orthoLayers,
  registerNoBlankProtocol,
  reliefColors,
  slopeLayers,
  worldLayer,
} from './map-3d-layers';
import { type Marker3d, markerElement } from './map-3d-markers';
import { terrainSource } from './map-3d-terrain';

import bus from '@/js/event-bus';

setWorkerUrl(workerUrl);
registerNoBlankProtocol();

const DOCUMENT_COLOR = '#f93';
const EXAGGERATION = 1.2;
// $gettext('Relief', 'Map layer')
const RELIEF = 'Relief';

const props = defineProps({
  // [west, south, east, north] in EPSG:4326, the extent shown by the 2D map
  bounds: {
    type: Array as unknown as PropType<[number, number, number, number]>,
    required: true,
  },
  // country of the 2D base layer, to open on the orthophoto of the same country
  country: {
    type: String,
    default: undefined,
  },
  // documents lines, EPSG:4326
  documents: {
    type: Object as PropType<FeatureCollection>,
    required: true,
  },
  // the waypoints, or the document itself when it has neither track nor waypoint
  markers: {
    type: Array as PropType<Marker3d[]>,
    default: () => [],
  },
  // the element that goes full screen, as for the 2D map: the map and the elevation profile; else the 3D view alone
  fullScreenElementId: {
    type: String as PropType<string | null>,
    default: null,
  },
});

defineEmits(['close']);

const router = useRouter();

const rootElementEl = useTemplateRef<HTMLElement>('rootElement');
const mapElementEl = useTemplateRef<HTMLElement>('mapElement');

const reliefLayer = { title: RELIEF, image: 'relief.jpg' };
// $gettext('Shading', 'Map layer')
const shadingButton = { title: 'Shading', image: 'shading.jpg' };
const baseLayers = [...orthoLayers, worldLayer, reliefLayer];

const startBounds = documentsBounds() ?? props.bounds;
const base = ref(
  (
    orthoLayers.find((layer) => layer.country === props.country) ??
    orthoLayerAt((startBounds[0] + startBounds[2]) / 2, (startBounds[1] + startBounds[3]) / 2) ??
    worldLayer
  ).title
);
const slopes = ref<string[]>([]);
const shading = ref(false);
const showLayerSwitcher = ref(false);
const isFullscreen = ref(false);
const bearing = ref(0);
const attributionCollapsed = ref(true);

// the credits of what is shown: the base layer (and the world one under the orthophotos), the slopes, the terrain
const attributions = computed(() => {
  const shown = [
    ...orthoLayers.filter((layer) => layer.title === base.value),
    ...(base.value === RELIEF ? [] : [worldLayer]),
    ...slopeLayers.filter((layer) => slopes.value.includes(layer.title)),
    terrainSource,
  ];
  return [...new Set(shown.map((layer) => layer.attribution))];
});

// not reactive: Vue proxies break WebGL map objects
let map: MapLibreMap | null = null;

const rasterSource = (layer: Layer3d): RasterSourceSpecification => ({
  type: 'raster',
  tiles: layer.tiles,
  tileSize: 256,
  maxzoom: layer.maxzoom,
  bounds: layer.bounds,
  attribution: layer.attribution,
});

const visibility = (visible: boolean) => (visible ? 'visible' : 'none');

// the world layer is under the national orthophotos, to fill the map past their borders
function showLayers() {
  if (!map) return;
  map.setLayoutProperty('world', 'visibility', visibility(base.value !== RELIEF));
  map.setLayoutProperty('relief', 'visibility', visibility(base.value === RELIEF));
  for (const layer of orthoLayers) {
    map.setLayoutProperty(layer.title, 'visibility', visibility(base.value === layer.title));
  }
  for (const layer of slopeLayers) {
    map.setLayoutProperty(layer.title, 'visibility', visibility(slopes.value.includes(layer.title)));
  }
  map.setLayoutProperty('shading', 'visibility', visibility(shading.value));
}

function toggleSlope(title: string) {
  slopes.value = slopes.value.includes(title) ? slopes.value.filter((t) => t !== title) : [...slopes.value, title];
}

const fullScreenElement = () =>
  (props.fullScreenElementId && document.getElementById(props.fullScreenElementId)) || rootElementEl.value!;

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    fullScreenElement().requestFullscreen();
  }
}

// also when the 2D map was full screen before the 3D view opened
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement && document.fullscreenElement === fullScreenElement();
}

// the point under the cursor of the elevation profile (ElevationProfile.vue), as on the 2D map; on the terrain, also
// under a flight
let profileMarker: Marker | null = null;

function profileMarkerElement(): HTMLElement {
  const element = document.createElement('div');
  element.style.cssText =
    'width: 10px; height: 10px; border-radius: 50%; background: yellow; border: 0.5px solid grey; pointer-events: none';
  return element;
}

function onElevationProfile(event: unknown) {
  const { action, coord } = event as { action: string; coord?: number[] };
  if (!map) return;
  if (action === 'cursor_end') {
    profileMarker?.remove();
    profileMarker = null;
  } else if (action === 'cursor_move' && coord) {
    // the profile gives EPSG:3857 coordinates
    const lngLat = toLonLat([coord[0], coord[1]]) as [number, number];
    profileMarker ??= new Marker({ element: profileMarkerElement() });
    profileMarker.setLngLat(lngLat).addTo(map);
    if (!map.getBounds().contains(lngLat)) map.easeTo({ center: lngLat, duration: 300 });
  }
}

function resetNorth() {
  map?.easeTo({ bearing: 0, pitch: 60 });
}

const FIT_OPTIONS = { padding: 80, maxZoom: 14 };

// back to the starting view, on the documents: after the map changed size (full screen left or entered, map pinned to
// a side or unpinned), as the 2D map fits its documents again then
function resetCamera() {
  if (!map) return;
  const camera = map.cameraForBounds(startBounds, { ...FIT_OPTIONS, bearing: 0 });
  if (camera) map.jumpTo({ ...camera, pitch: 60 });
}

let resizeTimer: ReturnType<typeof setTimeout> | undefined;
let lastSize = '';
const resizeObserver = new ResizeObserver(([entry]) => {
  const size = `${Math.round(entry.contentRect.width)}x${Math.round(entry.contentRect.height)}`;
  // the first call is the size at mount: nothing to reset
  if (lastSize && size !== lastSize) {
    clearTimeout(resizeTimer);
    // once the size settles (MapLibre resizes its canvas on the same change)
    resizeTimer = setTimeout(resetCamera, 200);
  }
  lastSize = size;
});

let shownMarkers: Marker[] = [];
let removeFlights: (() => void) | undefined;

// paragliding: the flights in the air, the walk on the ground. The search (terrain tiles) and deck.gl start as soon as
// the view opens, in parallel with the map; the track is only drawn once split, so that it does not first lie on the
// ground then jump into the air. If the search itself takes too long, the track is drawn on the ground meanwhile.
const FLIGHTS_WAIT = 5000;
async function showFlights(created: MapLibreMap, search: ReturnType<typeof findFlights>, loaded: Promise<void>) {
  const documents = () => created.getSource('documents') as GeoJSONSource | undefined;
  const fallback = setTimeout(() => map === created && documents()?.setData(props.documents), FLIGHTS_WAIT);
  const flights = await search.catch(() => null);
  // only the search counts: a slow map is not a reason to show the track on the ground first
  clearTimeout(fallback);
  await loaded;
  if (map !== created) return;
  if (!flights) {
    documents()?.setData(props.documents);
    return;
  }
  documents()?.setData(flights.documents);
  (created.getSource('flight-shadows') as GeoJSONSource).setData(flights.shadows);
  removeFlights = await addFlightLayers(created, flights);
}

function addMarkers(created: MapLibreMap) {
  shownMarkers.forEach((marker) => marker.remove());
  shownMarkers = props.markers.map((marker) => {
    const element = markerElement(marker);
    if (marker.to) {
      const to = marker.to;
      element.addEventListener('click', (event) => {
        if (event.ctrlKey || event.metaKey) {
          window.open(router.resolve(to).href, '_blank');
        } else {
          router.push(to);
        }
      });
    }
    return new Marker({ element, anchor: 'bottom', subpixelPositioning: true }).setLngLat(marker.lonLat).addTo(created);
  });
}

// the extent of the documents, so that the 3D view opens close to them
function documentsBounds(): [number, number, number, number] | null {
  const coordinates: number[][] = [];
  const collect = (value: unknown): void => {
    if (Array.isArray(value) && typeof value[0] === 'number') coordinates.push(value as number[]);
    else if (Array.isArray(value)) value.forEach(collect);
  };
  for (const feature of props.documents.features) {
    if ('coordinates' in feature.geometry) collect(feature.geometry.coordinates);
  }
  props.markers.forEach((marker) => coordinates.push(marker.lonLat));
  if (!coordinates.length) return null;
  const lons = coordinates.map((c) => c[0]);
  const lats = coordinates.map((c) => c[1]);
  // a single point: about 2 km around it
  const margin = coordinates.length === 1 ? 0.02 : 0;
  return [
    Math.min(...lons) - margin,
    Math.min(...lats) - margin,
    Math.max(...lons) + margin,
    Math.max(...lats) + margin,
  ];
}

onMounted(() => {
  const paragliding = hasParaglidingTrack(props.documents);
  const search = paragliding ? findFlights(props.documents, EXAGGERATION) : null;
  if (paragliding) loadFlightLayers().catch(() => undefined);

  const raster = (layer: Layer3d, opacity = 1) => ({
    id: layer.title,
    type: 'raster' as const,
    source: layer.title,
    layout: { visibility: 'none' as const },
    paint: { 'raster-opacity': opacity },
  });

  const created = new MapLibreMap({
    container: mapElementEl.value!,
    style: {
      version: 8,
      sources: {
        terrain: terrainSource,
        // a second source for the relief and the shading: sharing the terrain one makes MapLibre warn and render
        // them at a lower zoom
        relief: terrainSource,
        world: rasterSource(worldLayer),
        ...Object.fromEntries([...orthoLayers, ...slopeLayers].map((layer) => [layer.title, rasterSource(layer)])),
        documents: { type: 'geojson', data: paragliding ? withoutParaglidingTracks(props.documents) : props.documents },
        'flight-shadows': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      },
      layers: [
        { id: 'background', type: 'background', paint: { 'background-color': '#e6eef5' } },
        { ...raster(worldLayer), id: 'world', source: 'world' },
        {
          id: 'relief',
          type: 'color-relief',
          source: 'relief',
          layout: { visibility: 'none' },
          paint: { 'color-relief-color': ['interpolate', ['linear'], ['elevation'], ...reliefColors] },
        },
        ...orthoLayers.map((layer) => raster(layer)),
        {
          id: 'shading',
          type: 'hillshade',
          source: 'relief',
          layout: { visibility: 'none' },
          paint: { 'hillshade-exaggeration': 0.5 },
        },
        ...slopeLayers.map((layer) => raster(layer, 0.4)),
        {
          id: 'documents-line',
          type: 'line',
          source: 'documents',
          filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': DOCUMENT_COLOR, 'line-width': 4 },
        },
        // the shadow of the flights drawn in the air (paragliding)
        {
          id: 'flight-shadows',
          type: 'line',
          source: 'flight-shadows',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#222', 'line-opacity': 0.6, 'line-width': 2.5, 'line-dasharray': [2, 2] },
        },
      ],
      terrain: { source: 'terrain', exaggeration: EXAGGERATION },
      sky: { 'sky-color': '#9cc9f0', 'horizon-color': '#e6eef5', 'horizon-fog-blend': 0.6 },
    },
    bounds: startBounds,
    // fitBounds ignores the terrain: closer, the camera can end up inside a mountain
    fitBoundsOptions: FIT_OPTIONS,
    pitch: 60,
    maxPitch: 85,
    attributionControl: false,
  });
  map = created;

  created.addControl(new ScaleControl(), 'bottom-right');
  created.on('rotate', () => (bearing.value = created.getBearing()));
  created.on('load', showLayers);
  if (search) showFlights(created, search, new Promise((resolve) => created.once('load', () => resolve())));
  addMarkers(created);

  document.addEventListener('fullscreenchange', onFullscreenChange);
  onFullscreenChange();
  bus.on('elevation_profile', onElevationProfile);
  resizeObserver.observe(rootElementEl.value!);
});

watch([base, slopes, shading], showLayers);
watch(
  () => props.documents,
  (data) => (map?.getSource('documents') as GeoJSONSource | undefined)?.setData(data)
);

onBeforeUnmount(() => {
  resizeObserver.disconnect();
  clearTimeout(resizeTimer);
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  bus.off('elevation_profile', onElevationProfile);
  profileMarker?.remove();
  removeFlights?.();
  map?.remove();
  map = null;
});
</script>

<style scoped>
.map-3d {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: #e6eef5;
  /* outer size of a button, as in OlMap: the controls are positioned in em with it so they never overlap */
  --map-button-size: calc(1.375em + 2px);
}

.map-3d-canvas {
  width: 100%;
  height: 100%;
  /* MapLibre sets a 12px font on its map: the page's one, so that the controls placed in em (the scale) are where
     they are in 2D */
  font: inherit;
}

/* the controls are 0.5em from the edges of the map, as in OlMap */
.ol-full-screen {
  right: auto;
  left: 0.5em;
  top: calc(1em + 2 * var(--map-button-size));
}

.map-3d-compass {
  top: calc(1.5em + 3 * var(--map-button-size));
  left: 0.5em;
}

.map-3d-compass-needle {
  display: inline-block;
  font-size: 0.8em;
  line-height: 1;
}

.ol-control-layer-switcher-button {
  bottom: 0.5em;
  left: 0.5em;
}

.map-3d-2d-button {
  /* just above the layer switcher button, as the 3D one in OlMap */
  bottom: calc(1em + var(--map-button-size));
  left: 0.5em;

  /* a button of the same size as the others, with a smaller text so that two letters fit */
  span {
    font-size: 0.7em;
    font-weight: bold;
  }
}

/* the layer switcher of OlMap */
.ol-control-layer-switcher {
  z-index: 1;
  bottom: 0;
  left: 0;
  height: 100%;
  width: 225px;
  color: white;
  border: none;
  display: flex;
  align-items: flex-end;
  background-color: initial;
}

.ol-control-layer-switcher-layers {
  width: 205px;
  height: 100%;
  overflow-y: auto;
  padding: 10px 0 10px 10px;
  background-color: rgb(0, 59, 136, 0.7);

  header {
    font-weight: bold;
  }

  .layer-group {
    display: flex;
    flex-flow: row wrap;
    margin-left: -10px;
  }
}

.ol-control button.ol-control-layer-switcher-close {
  background-color: rgb(0, 59, 136, 0.7);
  color: white;
  width: 20px;
  height: 30px;
  margin: 0 0 5px;
  border-radius: 0 10px 10px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* the layer thumbnails are cropped to the button */
:deep(.layer-button) {
  background-size: cover;
}

/* the MapLibre scale at the place and with the look of the OpenLayers one (ol.css .ol-scale-line and its inner
   element): the corner container is the light rounded frame, the scale the grey bracket inside it */
:deep(.maplibregl-ctrl-bottom-right) {
  right: calc(1em + var(--map-button-size));
  bottom: calc(0.5em + 1px);
  padding: 2px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.75);
}

:deep(.maplibregl-ctrl-bottom-right .maplibregl-ctrl-scale) {
  margin: 1px;
  padding: 0;
  border: 1px solid #666666;
  border-top: none;
  background: none;
  color: #333333;
  font-size: 10px;
  line-height: 1.3;
  text-align: center;
  transition: width 0.25s;
}

/* the › of the open attribution in the middle of its button (OpenLayers draws it high) */
.ol-attribution button {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* as in OlMap; above the MapLibre scale (z-index 2), which it covers once open, as in 2D */
.ol-attribution {
  z-index: 3;
}

.ol-attribution ul {
  --ol-subtle-foreground-color: #666666;
  --ol-foreground-color: var(--c2c-grey-darker);

  display: flex;
  flex-direction: column;
}

.ol-attribution.ol-collapsed ul {
  display: none;
}

/* the document markers (map-3d-markers.ts): the icon and colours of the 2D ones (map-utils buildPointStyle), 20px
   icon, light translucent fill and grey ring, on a pin whose tip is the place (the marker is anchored at its
   bottom): in a tilted view a disc does not show which spot it marks. Bigger with the name on hover. Created by
   MapLibre outside the template: :deep */
:deep(.map-3d-marker) {
  display: flex;
  flex-direction: column;
  align-items: center;

  .map-3d-marker-body {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    margin-bottom: 6px;
    border: 2px solid #dddddd;
    border-radius: 50% 50% 50% 0;
    background: rgba(255, 255, 255, 0.5);
    transform: rotate(-45deg);
  }

  .map-3d-marker-icon {
    width: 20px;
    height: 20px;
    transform: rotate(45deg);
  }

  /* as the 2D label (map-utils buildTextStyle): 12px Verdana, black with a 3px white halo, no background, starting
     20px right of the marker centre, wrapped around 30 characters */
  .map-3d-marker-label {
    display: none;
    position: absolute;
    top: calc((100% - 6px) / 2);
    left: calc(50% + 20px);
    width: max-content;
    max-width: 30ch;
    transform: translateY(-50%);
    color: black;
    font:
      12px verdana,
      sans-serif;
    text-shadow:
      -1.5px -1.5px 0 white,
      0 -1.5px 0 white,
      1.5px -1.5px 0 white,
      1.5px 0 0 white,
      1.5px 1.5px 0 white,
      0 1.5px 0 white,
      -1.5px 1.5px 0 white,
      -1.5px 0 0 white;
  }

  &:hover {
    z-index: 1;

    .map-3d-marker-body {
      width: 40px;
      height: 40px;
    }

    .map-3d-marker-icon {
      width: 30px;
      height: 30px;
    }

    .map-3d-marker-label {
      display: block;
    }
  }
}

:deep(.map-3d-marker-link) {
  cursor: pointer;
}
</style>
