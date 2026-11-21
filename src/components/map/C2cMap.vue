<template>
  <div ref="rootElement" class="c2c-map" :class="{ 'ol-touch': isTouchDevice }">
    <div ref="mapElement" class="c2c-map-canvas" @click="showLayerSwitcher = false" />

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
        {{ isFullscreen ? '\u00d7' : '\u26f6' }}
      </button>
    </div>

    <div
      v-if="is3d"
      class="ol-control c2c-map-compass"
      :class="{ 'below-pin': showPinToTopButton && !isFullscreen }"
      :title="$gettext('North up', 'Map controls')"
    >
      <button type="button" :aria-label="$gettext('North up', 'Map controls')" @click="resetNorth">
        <span class="c2c-map-compass-needle" :style="{ transform: `rotate(${-bearing}deg)` }">▲</span>
      </button>
    </div>

    <div class="ol-control ol-control-layer-switcher-button" :title="$gettext('Layers', 'Map controls')">
      <!-- the title of the control, also the name of its button for screen readers -->
      <button :aria-label="$gettext('Layers', 'Map controls')" @click.stop="showLayerSwitcher = !showLayerSwitcher">
        <fa-icon icon="layer-group" />
      </button>
    </div>

    <!-- 3D view: the same map, tilted on the terrain -->
    <!-- the terrain and the imagery of the 3D view are not downloaded with the offline topos -->
    <div v-if="show3d && online" class="ol-control ol-control-3d" :title="is3d ? '2D' : '3D'">
      <button :aria-label="is3d ? '2D' : '3D'" @click.stop="is3d ? close3d() : open3d()">
        <span>{{ is3d ? '2D' : '3D' }}</span>
      </button>
    </div>

    <div
      v-show="showPinToTopButton && !isFullscreen"
      class="ol-control ol-control-pin-to-top"
      :title="$gettext('Pin the map to a side of the screen')"
    >
      <button :aria-label="$gettext('Pin the map to a side of the screen')" @click.stop="$emit('pin-to-top-clicked')">
        <fa-icon icon="fa-regular fa-window-maximize" />
      </button>
    </div>

    <div v-show="showLayerSwitcher" class="ol-control ol-control-layer-switcher" @click.stop="">
      <div class="ol-control-layer-switcher-layers">
        <div v-if="offlineStatus.length" class="c2c-map-offline-status" role="status">
          <header><fa-icon icon="plug" /> {{ $gettext('Offline') }}</header>
          <p v-for="line of offlineStatus" :key="line.title">
            <strong>{{ $gettext(line.title, 'Map layer') }}</strong>: {{ line.status }}
          </p>
        </div>
        <header v-translate>Base layer</header>
        <div class="layer-group">
          <layer-button
            v-for="layer of is3d ? baseLayers3d : online ? baseLayers : offlineBaseLayers"
            :key="layer.title"
            :layer="layer"
            :selected="layer.title === (is3d ? base3d : shownBase)"
            title-context="Map layer"
            @click="chooseBase(layer.title)"
          />
        </div>
        <!-- no tiles without a network for the other layers, nor for the overlays: not offered -->
        <header v-if="shownSlopeButtons.length" v-translate>Slopes</header>
        <div v-if="shownSlopeButtons.length" class="layer-group">
          <layer-button
            v-for="layer of shownSlopeButtons"
            :key="layer.title"
            :layer="layer"
            :selected="slopes.includes(layer.title)"
            title-context="Map slopes layer"
            @click="toggleSlope(layer.title)"
          />
        </div>
        <template v-if="showProtectionAreas && online">
          <header v-translate>Protection areas</header>
          <!-- $gettext('Fauna protection areas') -->
          <div class="layer-group">
            <layer-button
              :layer="protectionAreasLayerButton"
              :selected="protectionAreasVisible"
              @click="protectionAreasVisible = !protectionAreasVisible"
            />
          </div>
        </template>
        <template v-if="showDensityOverlays && !densityUnavailable && online">
          <header v-translate>Overlays</header>
          <!-- $gettext('Outings') $gettext('Routes') -->
          <div class="layer-group">
            <layer-button
              v-for="type of DENSITY_TYPES"
              :key="type"
              @click="toggleDensityOverlay(type)"
              :selected="densityEnabled[type]"
              :layer="{ title: DENSITY_OVERLAYS[type].title, color: DENSITY_OVERLAYS[type].trackColor }"
            ></layer-button>
          </div>
        </template>
        <template v-if="is3d">
          <header v-translate>Terrain</header>
          <div class="layer-group">
            <layer-button :layer="shadingButton" :selected="shading" title-context="Map layer" @click="toggleShading" />
          </div>
        </template>
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

    <div
      v-show="showCenterOnGeolocation && !is3d"
      :title="$gettext('Recenter on your current position')"
      class="ol-control ol-control-center-on-geolocation"
    >
      <button :aria-label="$gettext('Recenter on your current position')" @click="centerOnGeolocation">
        <fa-icon icon="bullseye" />
      </button>
    </div>

    <div v-show="filterControlShown && online" class="ol-control ol-control-use-map-as-filter">
      <input
        id="filter-documents-with-map"
        class="switch is-rtl is-rounded is-info is-small"
        type="checkbox"
        v-model="filterDocumentsWithMap"
      />
      <label
        for="filter-documents-with-map"
        v-translate
        :title="filterDocumentsWithMap ? $gettext('Map filter on') : $gettext('Map filter off')"
      >
        Filter on map extent
      </label>
    </div>

    <div
      v-show="showRecenterOn && !is3d && online"
      class="ol-control ol-control-recenter-on"
      :class="{ 'ol-control-recenter-on_on-top': !filterControlShown }"
    >
      <input
        type="text"
        ref="recenterOnPropositionsInput"
        :placeholder="$gettext('Recenter on...')"
        @input="searchRecenterOnPropositions"
        @focus="searchRecenterOnPropositions"
        @blur="clearRecenterOnPropositions"
      />
    </div>

    <div
      v-show="showRecenterOnPropositions"
      class="ol-control ol-control-recenter-on-propositions"
      :class="{ 'ol-control-recenter-on-propositions_on-top': !filterControlShown }"
    >
      <ul v-if="recenterPropositions?.data?.features">
        <li v-for="(item, i) of recenterPropositions.data.features" :key="i" @click="recenterOn(item)">
          {{ item.properties.name }},
          <small>
            <template v-if="item.properties.state">{{ item.properties.state }}, </template>{{ item.properties.country }}
          </small>
        </li>
      </ul>
      <div v-else v-translate>Loading...</div>
    </div>

    <div v-show="shownBase === 'OpenTopoMap' && !is3d && online" class="ol-control ol-control-edit-map">
      <a :href="editMapLink ?? undefined" :title="$gettext('Edit and improve map on Openstreetmap.org')"
        ><fa-icon icon="pen"
      /></a>
    </div>

    <!-- without a network: said next to the layer switcher, which tells what each layer shows (offlineStatus) -->
    <div v-if="offlineStatus.length && !showLayerSwitcher" class="ol-control c2c-map-offline-chip" role="status">
      <button type="button" @click.stop="showLayerSwitcher = true">
        <fa-icon icon="plug" />
        {{ $gettext('Offline') }}
      </button>
    </div>

    <!-- the credits of the visible layers, collapsed at first -->
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
        <!-- eslint-disable-next-line vue/no-v-html: our own constants (map-layers.ts, map-3d-terrain.ts) -->
        <li v-for="attribution of attributions" :key="attribution" v-html="attribution" />
      </ul>
    </div>

    <div v-if="showDensityOverlays" ref="trackTooltip" class="ol-track-tooltip" v-show="trackTooltip">
      <template v-if="trackTooltip">
        <strong>{{ trackTooltip.document.title }}</strong>
        <span v-if="trackTooltip.document.date_end" class="track-meta">
          {{ $dateUtils.toLocalizedString(trackTooltip.document.date_end, 'll') }}
        </span>
        <document-rating :document="trackTooltip.document" class="track-meta" />
        <span v-if="trackTooltip.others" class="track-meta"
          >{{ $gettext('Others here:') }} {{ trackTooltip.others }}</span
        >
      </template>
    </div>

    <!-- the tracks under a click or a tap, in the map: the most recent outings first -->
    <div
      v-if="showDensityOverlays"
      v-show="trackPanelEntries.length"
      class="ol-track-panel"
      :class="{ 'is-opening': !trackPanelReady }"
    >
      <header>
        <strong>{{ $gettext('Tracks here') }}</strong>
        <button type="button" class="delete" :aria-label="$gettext('Close')" @click="closeTrackPanel" />
      </header>
      <p v-if="trackPanelTruncated" class="track-panel-note">
        {{ $gettext('Only the most recent ones are listed') }}
        <template v-if="trackPanelCount">({{ trackPanelCount.count }}{{ trackPanelCount.capped ? '+' : '' }})</template>
      </p>
      <ul>
        <li
          v-for="entry of trackPanelEntries"
          :key="`${entry.document.type}-${entry.document.document_id}`"
          @mouseenter="highlightTrack(entry)"
          @mouseleave="highlightTrack(null)"
        >
          <span class="track-swatch" :style="trackSwatchStyle(entry.document)" />
          <div class="track-description">
            <router-link
              :to="{
                name: $documentUtils.getDocumentType(entry.document.type),
                params: { id: entry.document.document_id },
              }"
              :target="openInNewTab ? '_blank' : undefined"
              @click="closeTrackPanel"
              >{{ entry.document.title }}</router-link
            >
            <div class="track-meta">
              <span v-if="entry.document.date_end">
                {{ $dateUtils.toLocalizedString(entry.document.date_end, 'll') }}
              </span>
              <document-rating :document="entry.document" />
              <activities :activities="entry.document.activities" class="is-size-5" />
            </div>
          </div>
        </li>
      </ul>
    </div>

    <biodiv-information v-if="protectionAreasVisible" ref="biodivWindow" :data="biodivData" />

    <swiss-protection-area-information
      v-if="protectionAreasVisible"
      ref="swissWindow"
      :data="swissProtectionAreaData"
    />
  </div>
</template>

<script setup lang="ts">
// THE map of the site, on MapLibre: the documents of a page, the layers of the catalogue (map-layers.ts), and a 3D view
// on the same map (terrain, tilted camera, the paragliding flights in the air).
import type { Feature, FeatureCollection, Geometry, Point, Position } from 'geojson';
import {
  type GeoJSONSource,
  type LayerSpecification,
  Map as MapLibreMap,
  type MapLayerMouseEvent,
  type MapMouseEvent,
  Marker,
  type RasterTileSource,
  ScaleControl,
  setWorkerUrl,
  type SourceSpecification,
} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  type PropType,
  reactive,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';

import './map-controls.css';
import BiodivInformation from './BiodivInformation.vue';
import LayerButton from './LayerButton.vue';
import SwissProtectionAreaInformation from './SwissProtectionAreaInformation.vue';
import {
  DENSITY_FETCH_DEBOUNCE,
  DENSITY_OVERLAYS,
  DENSITY_TRACKS_MIN_ZOOM,
  DENSITY_TYPES,
  type DensityFilters,
  type DensityTrack,
  type DensityType,
  densityLayers,
  heatmapWeight,
  snapExtent,
  sortTracks,
  trackHighlightLayers,
} from './density-overlays';
import {
  addFlightLayers,
  type FlightLayers,
  findFlights,
  hasParaglidingTrack,
  loadFlightLayers,
  withoutParaglidingTracks,
} from './map-3d-flight-layers';
import { orthoLayerAt, registerNoBlankProtocol } from './map-3d-layers';
import { type Marker3d, markerElement } from './map-3d-markers';
import { terrainSource } from './map-3d-terrain';
import { fetchStyle, prepareVectorMap, vectorMaps } from './map-3d-vector';
import {
  type Diff,
  type DocumentFeature,
  documentFeatures,
  documentLayers,
  featureKey,
  featureStyle,
  getDocumentIcon,
  type Label,
  LINE_CASING_COLOR,
  labelAnchor,
  loadIcons,
  toGeoJson,
} from './map-documents';
import {
  baseLayerOf,
  baseLayers,
  categoryOf,
  countryOfAreas,
  OFFLINE_BASE_LAYER,
  type MapLayer,
  nationalOrthoLayers,
  orthoLayers,
  rasterSource,
  slopeLayers,
  swissExtent,
  swissProtectionLayers,
  worldLayer,
} from './map-layers';
import { MAP_URL_KEYS } from './map-url-keys';
import { parseMapUrl, storedLayerCategory, storedMapSettings, storeMapSettings, withMapUrl } from './map-url-state';
import { scrollPassthrough } from './scroll-passthrough';

import biodivSportsService from '@/js/apis/biodivsports-service';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import photon from '@/js/apis/photon';
import respecterCestProtegerService from '@/js/apis/respectercestproteger-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import debounce from '@/js/debounce';
import bus from '@/js/event-bus';
import {
  type Extent,
  extentFromLonLat,
  extentToLonLat,
  fromLonLat,
  geometryToLonLat,
  toLonLat,
} from '@/js/geo/projection';
import { toast } from '@/js/toast';
import { tracksOverlayEnabled } from '@/js/tracks-overlay';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { useOfflineStore } from '@/stores/offline';

setWorkerUrl(workerUrl);
registerNoBlankProtocol();

// in EPSG:3857, as the extents given by and to the pages
const DEFAULT_EXTENT: Extent = [-400000, 5200000, 1200000, 6000000];
// the zooms of MapLibre are those of OpenLayers minus one (512 px tiles): the zooms of the OpenLayers map minus one
const MIN_ZOOM_LEVEL = 13;
const MAX_ZOOM = 18;
const TRACKING_INITIAL_ZOOM = 12;

// the lines of the 3D view as on the 2D map: yellow on a dark casing, a little wider for the tilted view
const DOCUMENT_COLOR = '#ffff00';
const EXAGGERATION = 1.2;
// the 3D camera: fitBounds ignores the terrain, closer the camera can end up inside a mountain
const FIT_OPTIONS_3D = { padding: 80, maxZoom: 14 };
const PITCH_3D = 60;

// how far from a line or an icon a pointer still hits it, in pixels: the tracks are thin, a finger is not
const HIT_TOLERANCE = 6;
const TOUCH_HIT_TOLERANCE = 14;

// an area of BiodivSports
type BiodivResult = {
  id: number;
  name: string;
  description: string;
  info_url: string;
  kml_url: string;
  period: boolean[];
  geometry: Geometry;
};

// a place found by Photon, to recenter the map on
type PhotonFeature = {
  geometry: { coordinates: number[] };
  properties: Record<string, string | undefined> & { extent?: number[] };
};

const props = defineProps({
  documents: {
    type: Array as PropType<C2cDocument[]>,
    default: null,
  },
  showFilterControl: {
    type: Boolean,
    default: false,
  },
  showRecenterOn: {
    type: Boolean,
    default: false,
  },
  showCenterOnGeolocation: {
    type: Boolean,
    default: false,
  },
  showProtectionAreas: {
    type: Boolean,
    default: false,
  },
  // the layers and overlays of the map are kept on this device, from a document page to the next one; the query of an
  // old shared link (?layer=…) is read too: only for the page of a document, whose query is not used for anything else (a
  // listing's query is its search filters)
  rememberSettings: {
    type: Boolean,
    default: false,
  },
  // the layers and overlays of the map are in the query of the page, next to its other parameters (those of a list of
  // documents: its search filters), to share a list with its map
  syncUrl: {
    type: Boolean,
    default: false,
  },
  // search filters (the parameters of the documents listing) of the "Tracks" (outings) and "Routes" overlays, which
  // follow what the map shows. `null` means no filter.
  tracksFilters: {
    type: Object as PropType<DensityFilters>,
    default: null,
  },
  routesFilters: {
    type: Object as PropType<DensityFilters>,
    default: null,
  },
  biodivSportsActivities: {
    type: Array as PropType<string[] | null>,
    default: null,
  },
  // the two versions of a document in the diff view
  oldDocument: {
    type: Object as PropType<C2cDocument | null>,
    default: null,
  },
  newDocument: {
    type: Object as PropType<C2cDocument | null>,
    default: null,
  },
  highlightedDocument: {
    type: Object as PropType<C2cDocument | null>,
    default: null,
  },
  // in EPSG:3857
  initialExtent: {
    type: Array as PropType<number[] | null>,
    default: null,
  },
  // the element that goes full screen: the map and the elevation profile; else the map alone
  fullScreenElementId: {
    type: String as PropType<string | null>,
    default: null,
  },
  showPinToTopButton: {
    type: Boolean,
    default: false,
  },
  openInNewTab: {
    type: Boolean,
    default: false,
  },
  // the 3D button
  show3d: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'has-protection-area',
  'highlight-document',
  'move',
  'pin-to-top-clicked',
  'stop-clicked',
  'waypoint-clicked',
]);

const route = useRoute();
const router = useRouter();
// the settings of the document maps on this device, and what an old shared link says (it wins, for this page)
const initialSettings = props.rememberSettings
  ? { ...storedMapSettings(), ...parseMapUrl(route.query) }
  : props.syncUrl
    ? parseMapUrl(route.query)
    : {};
const { $documentUtils, $gettext, $language } = useGlobalProperties();
const trackTooltipEl = useTemplateRef<HTMLElement>('trackTooltip');

const rootElementEl = useTemplateRef<HTMLElement>('rootElement');
const mapElementEl = useTemplateRef<HTMLElement>('mapElement');
const recenterOnPropositionsInputEl = useTemplateRef<HTMLInputElement>('recenterOnPropositionsInput');
const biodivWindowEl = useTemplateRef<{ show(): void }>('biodivWindow');
const swissWindowEl = useTemplateRef<{ show(): void }>('swissWindow');

// the buttons are bigger on touch screens
const isTouchDevice = 'ontouchstart' in window;

// the layers shown: one base layer (in 2D and in 3D), the slopes, the protection areas, the shading in 3D
// A document map shows the layer of the category chosen on this device, in the country of the document (the layer of an
// old shared link, on its page, also chosen); a list shows the layer of its URL, else OpenTopoMap
const base = ref(
  initialSettings.base ??
    (props.rememberSettings ? baseLayerOf(storedLayerCategory() ?? 'topo', documentsCountry()) : baseLayers[0].title)
);
if (props.rememberSettings && initialSettings.base) storeSetting({ category: categoryOf(initialSettings.base) });
const base3d = ref(worldLayer.title);
const slopes = ref<string[]>(initialSettings.slopes ?? []);
const slopesOpacity = ref<Record<string, number>>(
  Object.fromEntries(slopeLayers.map((layer) => [layer.title, layer.opacity ?? 1]))
);
const protectionAreasVisible = ref(props.showProtectionAreas && initialSettings.protection !== false);
const protectionAreasOpacity = ref(swissProtectionLayers[0].opacity ?? 1);
const shading = ref(false);
// our shading: its strength (hillshade-exaggeration), set by the slider of its button
const shadingStrength = ref(0.4);

const is3d = ref(false);

// Without a network: the layers downloaded with the offline topos of the map (OpenTopoMap for each, SwissTopo and the
// slopes for some, src/pwa/offline-assets.ts); no protection areas, no 3D.
// The base layer chosen stays, at best effort, when the map had the network: the tiles it already loaded are still in
// its memory (not kept on the device: the licence of the IGN maps forbids it), the downloaded OpenTopoMap under it where
// it has none. A map opened without a network has nothing in memory: the downloaded layer instead. A layer chosen
// offline is not kept: back to the one chosen before when the network comes back
const offline = useOfflineStore();
const online = computed(() => offline.online);
const downloadedLayers = computed(() => {
  const titles = new Set<string>();
  for (const document of props.documents ?? []) {
    const type = $documentUtils.getDocumentType(document.type);
    const assets = type && document.document_id ? offline.find(type, document.document_id)?.assets : undefined;
    if (!assets) continue;
    titles.add(OFFLINE_BASE_LAYER);
    Object.keys(assets.layers ?? {}).forEach((title) => titles.add(title));
  }
  return titles;
});
// the map had the network since it was opened: its tiles in memory
const seenOnline = ref(online.value);
const offlineBase = ref<string | null>(null);
const shownBase = computed(() => {
  if (online.value) return base.value;
  if (offlineBase.value) return offlineBase.value;
  const fallback = !seenOnline.value && !downloadedLayers.value.has(base.value);
  return fallback && downloadedLayers.value.has(OFFLINE_BASE_LAYER) ? OFFLINE_BASE_LAYER : base.value;
});
// under a base layer without downloaded tiles: the downloaded OpenTopoMap, seen where the other one has no tile
const underBase = computed(() =>
  !online.value &&
  !is3d.value &&
  !downloadedLayers.value.has(shownBase.value) &&
  downloadedLayers.value.has(OFFLINE_BASE_LAYER)
    ? OFFLINE_BASE_LAYER
    : null
);
// offline, the downloaded layers and the one chosen when the map had the network
const offlineBaseLayers = computed(() =>
  baseLayers.filter(
    (layer) =>
      downloadedLayers.value.has(layer.title) ||
      layer.title === shownBase.value ||
      (seenOnline.value && layer.title === base.value)
  )
);
const shownSlopes = computed(() =>
  online.value ? slopes.value : slopes.value.filter((title) => downloadedLayers.value.has(title))
);
// what each base layer offers offline, said in the layer switcher
const offlineStatus = computed(() => {
  if (online.value || is3d.value) return [];
  const shown = shownBase.value;
  const replaced = shown !== base.value && !offlineBase.value;
  const lines: { title: string; status: string }[] = [];
  if (replaced) lines.push({ title: base.value, status: $gettext('not available offline') });
  let status: string;
  if (downloadedLayers.value.has(shown))
    status = replaced ? $gettext('downloaded, shown instead') : $gettext('downloaded');
  else if (seenOnline.value) status = $gettext('only the areas already seen');
  else status = $gettext('not available offline');
  lines.push({ title: shown, status });
  if (underBase.value) lines.push({ title: underBase.value, status: $gettext('downloaded, shown underneath') });
  return lines;
});

const showLayerSwitcher = ref(false);
const isFullscreen = ref(false);
const bearing = ref(0);
const attributionCollapsed = ref(true);
const filterDocumentsWithMap = ref(Boolean(route.query.bbox));
// not in full screen, where the results are not shown
const filterControlShown = computed(() => props.showFilterControl && !isFullscreen.value);
const recenterPropositions = ref<{ data?: { features: PhotonFeature[] } | null } | null>(null);
const showRecenterOnPropositions = ref(false);
const biodivData = ref<Record<string, unknown>>({});
const swissProtectionAreaData = ref<Record<string, unknown>>({ properties: {} });
const editMapLink = ref<string | null>(null);
// the extent of the view, in longitude, latitude: what the attributions are about
const viewExtent = shallowRef<Extent | null>(null);

// $gettext('Shading', 'Map layer')
const shadingButton = {
  title: 'Shading',
  image: 'shading.jpg',
  get: (name: string) => (name === 'configurable' ? true : name === 'opacity' ? shadingStrength.value : undefined),
  set: (name: string, value: number) => {
    if (name === 'opacity') shadingStrength.value = value;
  },
};
// the national maps drawn from their vector tiles in 3D (map-3d-vector.ts), where the 2D map shows their raster maps
const vectorLayers = baseLayers.filter((layer) => layer.title in vectorMaps && !layer.in3d);
const baseLayers3d = [...orthoLayers, ...vectorLayers, worldLayer];

// the slope buttons, with their opacity slider
const slopeButtons = slopeLayers.map((layer) => ({
  ...layer,
  get: (name: string) =>
    name === 'configurable' ? true : name === 'opacity' ? slopesOpacity.value[layer.title] : undefined,
  set: (name: string, value: number) => {
    if (name === 'opacity') slopesOpacity.value = { ...slopesOpacity.value, [layer.title]: value };
  },
}));

// the button of the protection areas, with the opacity of their layers
const protectionAreasLayerButton = {
  title: 'Fauna protection areas',
  image: 'fauna.jpg',
  get: (name: string) =>
    name === 'configurable' ? true : name === 'opacity' ? protectionAreasOpacity.value : undefined,
  set: (name: string, value: number) => {
    if (name === 'opacity') protectionAreasOpacity.value = value;
  },
};

const intersects = (a: Extent, b: Extent) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
// the layers with tiles in the view
const inView = (layer: MapLayer) => !layer.bounds || !viewExtent.value || intersects(layer.bounds, viewExtent.value);

// the credits of what is shown: the base layer (and the world one under the orthophotos in 3D), the slopes, the
// protection areas, the terrain in 3D
const attributions = computed(() => {
  const shown = is3d.value
    ? [...[...orthoLayers, ...vectorLayers].filter((layer) => layer.title === base3d.value), worldLayer]
    : baseLayers.filter((layer) => layer.title === shownBase.value);
  shown.push(...slopeLayers.filter((layer) => shownSlopes.value.includes(layer.title)));
  if (props.showProtectionAreas && protectionAreasVisible.value && online.value) shown.push(...swissProtectionLayers);
  const credits = shown.filter(inView).map((layer) => layer.attribution);
  if (is3d.value) credits.push(terrainSource.attribution);
  return [...new Set(credits)];
});

// not reactive: Vue proxies break WebGL map objects
let map: MapLibreMap | null = null;
// a promise of the map with its style loaded
let loaded: Promise<void> = Promise.resolve();

const visibility = (visible: boolean) => (visible ? 'visible' : 'none');

// --- the documents ---

// the features of the documents, of their waypoints and images, of the diff
let features: DocumentFeature[] = [];
const featuresByKey = new Map<string, DocumentFeature>();
// the feature under the pointer (or of the list item hovered), and the stop highlighted by the page
const hoveredKey = ref<string | null>(null);
const stopKey = ref<string | null>(null);
let labelMarkers: Marker[] = [];

const title = (document: C2cDocument) => $documentUtils.getDocumentTitle(document);
const isNotVirtual = (waypoint: C2cDocument) => waypoint.waypoint_type !== 'virtual';

function collectFeatures() {
  const diff = (document: C2cDocument | null, version: Diff) => documentFeatures(document, 'documents', version);
  features = [...diff(props.oldDocument, 'old'), ...diff(props.newDocument, 'new')];
  for (const document of props.documents ?? []) {
    features.push(...documentFeatures(document, 'documents'));
    const waypoints = [
      ...(document.associations?.waypoints ?? []),
      ...(document.associations?.waypoint_children ?? []),
    ].filter(isNotVirtual);
    waypoints.forEach((waypoint) => features.push(...documentFeatures(waypoint, 'waypoints')));
    // the images of an outing, where they are not at the place of the outing
    if (document.type === 'o') {
      (document.associations?.images ?? [])
        .filter((image) => !$documentUtils.hasSameGeolocation(image, document))
        .forEach((image) => features.push(...documentFeatures(image, 'images')));
    }
  }
  featuresByKey.clear();
  features.forEach((feature) => featuresByKey.set(feature.key, feature));
}

function labelElement({ text, publicTransport }: Label) {
  const element = document.createElement('div');
  element.className = 'c2c-map-label' + (publicTransport ? ' c2c-map-label-large' : '');
  element.textContent = text;
  return element;
}

// draws the documents again: after a change of the documents or of the highlighted one
let renderId = 0;
async function renderDocuments() {
  if (!map) return;
  const id = ++renderId;
  const created = map;
  const labels: { label: Label; at: [number, number] }[] = [];
  const geoJson: Feature[] = [];
  for (const feature of features) {
    const highlight = feature.key === hoveredKey.value || feature.key === stopKey.value;
    // a stop is named after its stop area
    const name = feature.key === stopKey.value ? (feature.document.stoparea_name as string) : title(feature.document);
    const { style, label } = featureStyle(feature, name, highlight);
    if (style) geoJson.push(toGeoJson(feature, style));
    if (label) labels.push({ label, at: labelAnchor(feature.geometry) });
  }
  await loaded;
  await loadIcons(created, geoJson);
  if (id !== renderId || map !== created) return;
  (created.getSource('documents') as GeoJSONSource).setData({ type: 'FeatureCollection', features: geoJson });
  labelMarkers.forEach((marker) => marker.remove());
  labelMarkers = labels.map(({ label, at }) =>
    new Marker({ element: labelElement(label), anchor: 'left', offset: [20, 0] }).setLngLat(at).addTo(created)
  );
}

function drawDocumentMarkers() {
  collectFeatures();
  renderDocuments();
}

function setHoveredKey(key: string | null) {
  if (key === hoveredKey.value) return;
  hoveredKey.value = key;
  renderDocuments();
}

// the feature of a document in the list: its point, or its line when it has one
const documentKey = (document: C2cDocument) =>
  [featureKey('documents', document, 'point'), featureKey('documents', document, 'detail')].find(
    (key) => featuresByKey.get(key)?.document.type !== 'a' && featuresByKey.has(key)
  ) ?? null;

// --- the view ---

// the extent of the view in EPSG:3857, or in longitude, latitude
function getExtent(projection = 'EPSG:3857'): Extent {
  const bounds = map!.getBounds();
  const lonLat: Extent = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
  return projection === 'EPSG:4326' ? lonLat : extentFromLonLat(lonLat);
}

const rounded = (extent: number[]) => extent.map(Math.round);
const isFiniteExtent = (extent: number[] | null | undefined): extent is Extent =>
  !!extent && extent.filter(Number.isFinite).length === 4;

// the extent (EPSG:3857) fills the view, a little smaller, and not too close
function fit(extent: number[]) {
  const camera = map!.cameraForBounds(extentToLonLat(extent) as Extent, { padding: 0 });
  if (camera) {
    // in OpenLayers zooms: 95 % of the zoom, at most the minimum zoom of a point
    const zoom = Math.min(MIN_ZOOM_LEVEL + 1, ((camera.zoom ?? 0) + 1) * 0.95) - 1;
    map!.jumpTo({ center: camera.center, zoom });
  }
  return rounded(getExtent());
}

// the extent of a geometry in longitude, latitude
function geometryExtent(geometry: Geometry): Extent {
  const extent: Extent = [Infinity, Infinity, -Infinity, -Infinity];
  const visit = (positions: unknown): void => {
    if (Array.isArray(positions) && typeof positions[0] === 'number') {
      const [x, y] = positions as number[];
      extent[0] = Math.min(extent[0], x);
      extent[1] = Math.min(extent[1], y);
      extent[2] = Math.max(extent[2], x);
      extent[3] = Math.max(extent[3], y);
    } else if (Array.isArray(positions)) positions.forEach(visit);
  };
  visit((geometry as { coordinates?: unknown }).coordinates);
  return extent;
}

const extend = (a: Extent, b: Extent): Extent => [
  Math.min(a[0], b[0]),
  Math.min(a[1], b[1]),
  Math.max(a[2], b[2]),
  Math.max(a[3], b[3]),
];
const EMPTY: Extent = [Infinity, Infinity, -Infinity, -Infinity];

// the map was shown before the documents of a search: it fits them when they come
let fitOnFirstDocuments = false;

const queryIds = (value: unknown) =>
  (Array.isArray(value) ? value.map(String) : String(value).split(',')).map(Number).filter(Boolean);

async function fitMapToDocuments(force?: boolean) {
  if (filterDocumentsWithMap.value && !force) {
    return rounded(getExtent());
  }
  // the 3D view (pinned to a side or unpinned): back to its tilted view of the documents
  if (is3d.value) {
    resetCamera();
    return rounded(getExtent());
  }
  drawDocumentMarkers();

  // the documents and their waypoints, not their images
  let extent = features
    .filter((feature) => feature.group !== 'images')
    .map((feature) => geometryExtent(feature.geometry))
    .reduce(extend, EMPTY);
  extent = isFiniteExtent(extent) ? extentFromLonLat(extent) : EMPTY;

  if (!isFiniteExtent(extent)) {
    // the areas and the waypoints of the search
    if (route.query.a) {
      const areas = await Promise.all(queryIds(route.query.a).map((id) => (c2c.area as DocumentService).get(id)));
      extent = areas
        .map((response) => response.data.geometry?.geom_detail)
        .filter((geom): geom is string => !!geom)
        .map((geom) => geometryExtent(JSON.parse(geom)))
        .reduce(extend, EMPTY);
    }
    if (route.query.w) {
      const waypoints = await Promise.all(
        queryIds(route.query.w).map((id) => (c2c.waypoint as DocumentService).get(id))
      );
      extent = waypoints
        .map((response) => response.data.geometry?.geom)
        .filter((geom): geom is string => !!geom)
        .map((geom) => {
          const [x, y] = JSON.parse(geom).coordinates as number[];
          return [x - 10000, y - 10000, x + 10000, y + 10000] as Extent;
        })
        .reduce(extend, extent);
    }
    if (!isFiniteExtent(extent)) {
      extent = DEFAULT_EXTENT;
    }
  }
  return fit(extent);
}

/** Center and zoom the map on the lines of the documents */
function recenterOnDocuments() {
  if (!map || !props.documents?.length) {
    return;
  }
  const lines = props.documents
    .map((document) => document.geometry?.geom_detail)
    .filter((geom): geom is string => !!geom)
    .map((geom) => JSON.parse(geom) as Geometry)
    .filter((geometry) => geometry.type === 'LineString');
  // the coordinates may be in longitude, latitude
  const toMercator = ([x, y]: number[]) => (Math.abs(x) <= 180 && Math.abs(y) <= 90 ? fromLonLat([x, y]) : [x, y]);
  const extent = lines
    .flatMap((line) => (line as { coordinates: Position[] }).coordinates.map(toMercator))
    .reduce<Extent>((acc, [x, y]) => extend(acc, [x, y, x, y]), EMPTY);
  if (!isFiniteExtent(extent)) {
    map.fitBounds(extentToLonLat(DEFAULT_EXTENT), { duration: 0 });
    return;
  }
  const canvas = map.getContainer();
  const ratio = 50 / Math.min(canvas.clientWidth, canvas.clientHeight);
  const [width, height] = [extent[2] - extent[0], extent[3] - extent[1]];
  const padded = [
    extent[0] - width * ratio,
    extent[1] - height * ratio,
    extent[2] + width * ratio,
    extent[3] + height * ratio,
  ];
  map.fitBounds(extentToLonLat(padded), { duration: 1000, maxZoom: MAX_ZOOM - 1, padding: 0 });
}

function emitMoveEvent() {
  emit('move', rounded(getExtent()));
}

// in 3D, the top of the box lowered with the tilt: from the top of the screen at the first, to its middle at the second
const FILTER_TILTS_3D = [45, 85];
// and always under the horizon, by this many degrees
const FILTER_DEPRESSION_3D = 5;

// how far from the origin, along the direction, the segment a-b is crossed: Infinity when it is not
function rayToSegment([ox, oy]: number[], [dx, dy]: number[], [ax, ay]: number[], [bx, by]: number[]) {
  const [ex, ey] = [bx - ax, by - ay];
  const det = dx * ey - dy * ex;
  const t = ((ax - ox) * ey - (ay - oy) * ex) / det;
  const u = ((ax - ox) * dy - (ay - oy) * dx) / det;
  return det && t > 0 && u >= 0 && u <= 1 ? t : Infinity;
}

// the extent the documents are filtered with. The ground seen in 3D is a trapezoid, rotated with the map: its box holds
// much that is not seen. In 3D, the box within it: of the middles of its sides, and of how far it goes north, south,
// east and west of its center. Measured on outings, 90 to 100 % of the results are seen, instead of 30 to 90 %.
function filterExtent(): Extent {
  if (!is3d.value) return getExtent();
  const { clientWidth: w, clientHeight: h } = map!.getContainer();
  const focal = h / 2 / Math.tan((map!.getVerticalFieldOfView() * Math.PI) / 360);
  const pitch = map!.getPitch();
  const angle = Math.max(0, 90 - pitch - FILTER_DEPRESSION_3D);
  const [from, to] = FILTER_TILTS_3D;
  const lowered = ((h / 2) * (pitch - from)) / (to - from);
  // the top of the screen, lowered with the tilt and under the horizon, at most to the middle
  const top = Math.min(h / 2, Math.max(0, lowered, h / 2 - focal * Math.tan((angle * Math.PI) / 180)));
  const ground = (x: number, y: number) => {
    const { lng, lat } = map!.unproject([x, y]);
    return fromLonLat([lng, lat]);
  };
  const center = ground(w / 2, (top + h) / 2);
  const middles = [ground(w / 2, h), ground(w / 2, top), ground(0, (top + h) / 2), ground(w, (top + h) / 2)];
  const corners = [ground(0, h), ground(w, h), ground(w, top), ground(0, top)];
  const reach = (direction: number[]) =>
    Math.min(...corners.map((corner, i) => rayToSegment(center, direction, corner, corners[(i + 1) % 4])));
  const xs = middles.map(([x]) => x);
  const ys = middles.map(([, y]) => y);
  return [
    Math.max(Math.min(...xs), center[0] - reach([-1, 0])),
    Math.max(Math.min(...ys), center[1] - reach([0, -1])),
    Math.min(Math.max(...xs), center[0] + reach([1, 0])),
    Math.min(Math.max(...ys), center[1] + reach([0, 1])),
  ];
}

// in 3D, the outline of the extent the documents are filtered with
function showFilterOutline(extent: number[] | null) {
  const source = map?.getSource('filter-outline') as GeoJSONSource | undefined;
  if (!extent) return source?.setData(EMPTY_COLLECTION);
  const [west, south, east, north] = extentToLonLat(extent) as Extent;
  const ring = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
  source?.setData({ type: 'Polygon', coordinates: [ring] });
}

// the extent in the URL when the map filters the documents
function sendBoundsToUrl() {
  const query: LocationQueryRaw = { ...route.query };
  const extent = filterDocumentsWithMap.value ? rounded(filterExtent()) : null;
  showFilterOutline(is3d.value ? extent : null);
  query.bbox = extent?.join(',');
  if (query.bbox !== route.query.bbox && !String(route.name).endsWith('-print')) {
    router.push({ query });
  }
}

function updateEditMapLink() {
  const { lng, lat } = map!.getCenter();
  editMapLink.value = `https://www.openstreetmap.org/#map=13/${lat}/${lng}`;
}

// --- the layers ---

function showLayers() {
  if (!map) return;
  const set = (id: string, visible: boolean) => map!.setLayoutProperty(id, 'visibility', visibility(visible));
  const visibleBase = is3d.value ? base3d.value : shownBase.value;
  // in 3D, the raster maps not allowed there are drawn from their vector tiles instead (showVectorMap)
  for (const layer of baseLayers) {
    const shown = (layer.title === visibleBase || layer.title === underBase.value) && (!is3d.value || !!layer.in3d);
    set(layer.title, shown && !(is3d.value && layer.tiles3d));
    if (layer.tiles3d) set(layer3dId(layer), shown && is3d.value);
  }
  set('world', is3d.value);
  set('shading', is3d.value && shading.value);
  map.setPaintProperty('shading', 'hillshade-exaggeration', shadingStrength.value);
  for (const layer of slopeLayers) {
    set(layer.title, shownSlopes.value.includes(layer.title));
    map.setPaintProperty(layer.title, 'raster-opacity', slopesOpacity.value[layer.title]);
  }
  // the protection areas: lighter in 3D, multiplied onto the ground, which keeps its texture under their colours
  const protection = props.showProtectionAreas && protectionAreasVisible.value && online.value;
  const opacity = protectionAreasOpacity.value;
  for (const layer of swissProtectionLayers) {
    set(layer.title, protection);
    map.setPaintProperty(layer.title, 'raster-opacity', is3d.value ? 0.7 : opacity);
    map.setPaintProperty(layer.title, 'raster-layer-blend', is3d.value ? 'multiply' : 'normal');
  }
  set('protection-fill', protection);
  set('protection-line', protection);
  map.setPaintProperty('protection-fill', 'fill-opacity', is3d.value ? 0.4 : opacity * 0.5);
  map.setPaintProperty('protection-fill', 'fill-layer-blend', is3d.value ? 'multiply' : 'normal');
  map.setPaintProperty('protection-line', 'line-color', is3d.value ? 'rgb(120, 95, 0)' : 'rgb(100, 100, 100)');
  map.setPaintProperty('protection-line', 'line-opacity', is3d.value ? 0.6 : opacity * 0.5);
  // the documents: in 3D, the lines of the 3D view and its markers
  for (const id of documentLayerIds) set(id, !is3d.value);
  set('documents-3d', is3d.value);
  set('documents-3d-casing', is3d.value);
  set('flight-shadows', is3d.value);
  map.setPaintProperty('background', 'background-color', is3d.value ? '#e6eef5' : 'white');
}

// offline, the slopes downloaded only
const shownSlopeButtons = computed(() =>
  online.value ? slopeButtons : slopeButtons.filter((layer) => downloadedLayers.value.has(layer.title))
);

// a flat vector map has no relief drawn: our shading goes on with it, and off when it was put on for it alone
let shadingForVector = false;
function toggleShading() {
  shading.value = !shading.value;
  shadingForVector = false;
}
watch([is3d, base3d], () => {
  const vector = is3d.value && Boolean(vectorMaps[base3d.value]?.flat);
  if (vector && !shading.value) {
    shading.value = true;
    shadingForVector = true;
  } else if (!vector && shadingForVector) {
    shading.value = false;
    shadingForVector = false;
  }
});

// the vector map on the map, in 3D: its title and what it added
let vectorShown: { title: string; layers: string[]; sources: string[]; sprites: string[] } | null = null;
const VECTOR_PREFIX = 'vector-';
// their names and icons: over the slopes and the protection areas, under the documents
const LABELS_BEFORE = DENSITY_TYPES.flatMap(densityLayers)[0].id;

function removeVectorMap(from: MapLibreMap) {
  if (!vectorShown) return;
  vectorShown.layers.forEach((id) => from.removeLayer(id));
  vectorShown.sources.forEach((id) => from.removeSource(id));
  vectorShown.sprites.forEach((id) => from.removeSprite(id));
  vectorShown = null;
}

// the vector map of the base layer of the 3D view, if it has one; none in 2D
async function showVectorMap() {
  const created = map;
  if (!created) return;
  const title = is3d.value && base3d.value in vectorMaps ? base3d.value : null;
  if (vectorShown?.title === title) return;
  removeVectorMap(created);
  if (!title) return;
  const vector = vectorMaps[title];
  // claimed now: another choice while the style loads replaces it
  const shown = { title, layers: [] as string[], sources: [] as string[], sprites: [] as string[] };
  vectorShown = shown;
  let prepared;
  try {
    prepared = prepareVectorMap(vector, await fetchStyle(vector.styleUrl), VECTOR_PREFIX);
    await loaded;
  } catch (error) {
    // the world layer stays alone under the documents
    console.warn(error);
    if (vectorShown === shown) vectorShown = null;
    return;
  }
  if (map !== created || vectorShown !== shown) return;
  if (prepared.glyphs) created.setGlyphs(prepared.glyphs);
  // the layers wait for their sprites: an icon missing when a tile is laid out stays missing in that tile
  const sprites = prepared.sprites.map((sprite) => {
    shown.sprites.push(sprite.id);
    return new Promise<void>((resolve) => created.style.addSprite(sprite.id, sprite.url, {}, () => resolve()));
  });
  await Promise.all(sprites);
  if (map !== created || vectorShown !== shown) return;
  for (const [id, source] of Object.entries(prepared.sources)) {
    created.addSource(id, source);
    shown.sources.push(id);
  }
  for (const layer of prepared.ground) {
    created.addLayer(layer, 'shading');
    shown.layers.push(layer.id);
  }
  for (const layer of prepared.labels) {
    created.addLayer(layer, LABELS_BEFORE);
    shown.layers.push(layer.id);
  }
}

function toggleSlope(title: string) {
  slopes.value = slopes.value.includes(title) ? slopes.value.filter((t) => t !== title) : [...slopes.value, title];
}

// the base layers with other tiles in 3D (tiles3d), drawn there by a layer of their own
const baseLayers3dTiles = baseLayers.filter((layer) => layer.tiles3d);
const layer3dId = (layer: MapLayer) => `${layer.title} 3D`;

const raster = (layer: MapLayer, id = layer.title): LayerSpecification => ({
  id,
  type: 'raster',
  source: id,
  layout: { visibility: 'none' },
  paint: { 'raster-opacity': layer.opacity ?? 1 },
});

const { documents: documentsLayers, waypoints: waypointsLayers } = documentLayers('documents');
const documentLayerIds = [...documentsLayers, ...waypointsLayers, { id: 'profile' }].map((layer) => layer.id);
const hoverableLayerIds = [...documentsLayers, ...waypointsLayers].map((layer) => layer.id);
const EMPTY_COLLECTION: FeatureCollection = { type: 'FeatureCollection', features: [] };

function style() {
  const sources: Record<string, SourceSpecification> = {
    // a second source for the shading: sharing the terrain one makes MapLibre warn and render it at a lower zoom
    terrain: terrainSource,
    shading: terrainSource,
    world: rasterSource(worldLayer),
    ...Object.fromEntries(
      [...baseLayers, ...slopeLayers, ...swissProtectionLayers].map((layer) => [layer.title, rasterSource(layer)])
    ),
    ...Object.fromEntries(
      baseLayers3dTiles.map((layer) => [layer3dId(layer), rasterSource({ ...layer, ...layer.tiles3d! })])
    ),
    protection: { type: 'geojson', data: EMPTY_COLLECTION },
    documents: { type: 'geojson', data: EMPTY_COLLECTION },
    profile: { type: 'geojson', data: EMPTY_COLLECTION },
    'documents-3d': { type: 'geojson', data: EMPTY_COLLECTION },
    'flight-shadows': { type: 'geojson', data: EMPTY_COLLECTION },
    'track-highlight': { type: 'geojson', data: EMPTY_COLLECTION },
    'filter-outline': { type: 'geojson', data: EMPTY_COLLECTION },
    ...Object.fromEntries(
      DENSITY_TYPES.flatMap((type) => [
        [`heatmap-${type}`, { type: 'geojson', data: EMPTY_COLLECTION }],
        [`tracks-${type}`, { type: 'geojson', data: EMPTY_COLLECTION }],
      ])
    ),
  };
  const layers: LayerSpecification[] = [
    { id: 'background', type: 'background', paint: { 'background-color': 'white' } },
    raster(worldLayer, 'world'),
    ...baseLayers.map((layer) => raster(layer)),
    ...baseLayers3dTiles.map((layer) => raster(layer, layer3dId(layer))),
    {
      id: 'shading',
      type: 'hillshade',
      source: 'shading',
      layout: { visibility: 'none' },
      // igor: the softest method, the closest to the swisstopo relief shading; its strength in showLayers()
      paint: { 'hillshade-method': 'igor' },
    },
    ...slopeLayers.map((layer) => raster(layer)),
    ...swissProtectionLayers.map((layer) => raster(layer)),
    {
      id: 'protection-fill',
      type: 'fill',
      source: 'protection',
      layout: { visibility: 'none' },
      paint: { 'fill-color': 'rgb(251, 201, 0)' },
    },
    {
      id: 'protection-line',
      type: 'line',
      source: 'protection',
      layout: { visibility: 'none' },
      paint: { 'line-width': 1.5 },
    },
    {
      id: 'filter-outline',
      type: 'line',
      source: 'filter-outline',
      paint: { 'line-color': '#3e8ed0', 'line-width': 2.5, 'line-dasharray': [3, 2] },
    },
    ...DENSITY_TYPES.flatMap(densityLayers),
    ...documentsLayers,
    // over the lines, under the waypoints
    ...trackHighlightLayers(),
    ...waypointsLayers,
    // the point of the elevation profile under its cursor
    {
      id: 'profile',
      type: 'circle',
      source: 'profile',
      paint: {
        'circle-radius': 4.75,
        'circle-color': 'yellow',
        'circle-stroke-color': LINE_CASING_COLOR,
        'circle-stroke-width': 0.5,
      },
    },
    // the 3D view: the lines of the documents, and the shadow of the flights drawn in the air (paragliding)
    {
      id: 'documents-3d-casing',
      type: 'line',
      source: 'documents-3d',
      filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
      layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': LINE_CASING_COLOR, 'line-width': 7 },
    },
    {
      id: 'documents-3d',
      type: 'line',
      source: 'documents-3d',
      layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': DOCUMENT_COLOR, 'line-width': 4 },
    },
    {
      id: 'flight-shadows',
      type: 'line',
      source: 'flight-shadows',
      layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#222', 'line-opacity': 0.6, 'line-width': 2.5, 'line-dasharray': [2, 2] },
    },
  ];
  return { version: 8 as const, sources, layers };
}

// --- pointer ---

// a pointer that is not a mouse: a finger
const isTouch = (event: MapMouseEvent) => {
  const original = event.originalEvent as (MouseEvent & { pointerType?: string }) | TouchEvent;
  return (
    (typeof TouchEvent !== 'undefined' && original instanceof TouchEvent) ||
    (original as PointerEvent).pointerType === 'touch'
  );
};

// What is under a point, the topmost first, by feature: in the documents (markers, lines, images) to hover; in all
// that is drawn (the protection areas too) to click
function hitsAt(point: { x: number; y: number }, tolerance: number, layers: string[]) {
  const hits = map!.queryRenderedFeatures(
    [
      [point.x - tolerance, point.y - tolerance],
      [point.x + tolerance, point.y + tolerance],
    ],
    { layers: layers.filter((id) => map!.getLayer(id)) }
  );
  const seen = new Set<string>();
  return hits.filter((hit) => {
    const key = (hit.properties?.key ?? `${hit.layer.id}:${hit.id ?? JSON.stringify(hit.properties)}`) as string;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// the tracks of the overlays among the hits, the most recent outings first, except the document the map is about
function tracksIn(hits: { layer: { id: string }; properties: Record<string, unknown> }[]): TrackEntry[] {
  if (!showDensityOverlays.value) return [];
  const displayed = props.documents?.length === 1 ? props.documents[0] : null;
  const entries = hits
    .map((hit) => tracks.get(hit.properties?.key as string))
    .filter((entry): entry is TrackEntry => !!entry)
    .filter(
      ({ document }) =>
        !(displayed && document.type === displayed.type && document.document_id === displayed.document_id)
    );
  const byDocument = new Map(entries.map((entry) => [entry.document, entry]));
  return sortTracks([...byDocument.keys()]).map((document) => byDocument.get(document)!);
}

const trackLayerIds = DENSITY_TYPES.flatMap((type) => [`tracks-${type}-casing`, `tracks-${type}-line`]);

function onPointerMove(event: MapLayerMouseEvent) {
  // no hit detection while panning, nor in 3D (its markers are HTML)
  if ((event.originalEvent as MouseEvent).buttons || is3d.value) return;
  const hits = hitsAt(event.point, HIT_TOLERANCE, [...hoverableLayerIds, ...trackLayerIds]);
  // the topmost feature of the documents: the markers come before the tracks
  const documentHit = hits.find((hit) => !trackLayerIds.includes(hit.layer.id));
  const hoveredTracks = documentHit?.geometry.type === 'Point' ? [] : tracksIn(hits);
  const track = hoveredTracks[0] ?? null;
  const key = track ? null : ((documentHit?.properties?.key as string | undefined) ?? null);
  // the pages react to each event (the nearby stops reset all their styles): only tell them about changes
  if (key !== hoveredKey.value || track !== highlightedTrack) {
    setHoveredKey(key);
    highlightTrack(track);
    emit('highlight-document', track?.document ?? (key ? featuresByKey.get(key)!.document : null));
  }
  // not over the panel of the tracks, which tells it all
  if (track && !trackPanelEntries.value.length) {
    trackTooltip.value = { document: track.document, others: hoveredTracks.length - 1 };
    trackTooltipMarker?.setLngLat(event.lngLat).addTo(map!);
  } else {
    hideTrackTooltip();
  }
}

function onPointerOut() {
  setHoveredKey(null);
  hideTrackTooltip();
}

function openDocument(document: C2cDocument, newTab: boolean) {
  const location = { name: $documentUtils.getDocumentType(document.type), params: { id: document.document_id } };
  if (newTab || props.openInNewTab) {
    window.open(window.location.origin + router.resolve(location).href, '_blank');
  } else {
    router.push(location);
  }
}

function onClick(event: MapMouseEvent) {
  if (is3d.value) return;
  // a lookup of the most recent documents, still running, is for an older click
  recentRequest?.abort();
  const touch = isTouch(event);
  const hits = hitsAt(event.point, touch ? TOUCH_HIT_TOLERANCE : HIT_TOLERANCE, [
    ...hoverableLayerIds,
    ...trackLayerIds,
    'protection-fill',
  ]);
  const documentHit = hits.find((hit) => hoverableLayerIds.includes(hit.layer.id));
  const clickedTracks = documentHit?.geometry.type === 'Point' ? [] : tracksIn(hits);
  // several tracks under the click, or one under a finger: choose one, or see what it is
  if (clickedTracks.length > 1 || (clickedTracks.length === 1 && touch)) {
    openTrackPanel(clickedTracks, touch);
    return;
  }
  closeTrackPanel();
  // a track is thin: clicking next to it counts
  const hit = clickedTracks.length ? null : hits.find((h) => !trackLayerIds.includes(h.layer.id));
  const document =
    clickedTracks[0]?.document ?? (hit ? featuresByKey.get(hit.properties?.key as string)?.document : undefined);

  if (document) {
    const properties = document.properties as { nonInteractive?: boolean } | undefined;
    if (properties?.nonInteractive && document.type === 'w' && document.waypoint_type === 'access') {
      emit('waypoint-clicked', document);
    } else if (properties?.nonInteractive) {
      return;
    } else if ((document.type as string) === 'z') {
      emit('waypoint-clicked', document);
    } else if (document.type === 's') {
      emit('stop-clicked', document.document_id);
    } else if (!(props.documents?.length === 1 && document.document_id === props.documents[0].document_id)) {
      openDocument(document as C2cDocument, (event.originalEvent as MouseEvent).ctrlKey);
    }
  } else if (hit?.layer.id === 'protection-fill') {
    biodivData.value = JSON.parse(hit.properties.biodivData as string);
    biodivWindowEl.value!.show();
  } else if (!hit) {
    // a click on the density of an overlay: the most recent documents there
    // (the identification of the protection areas goes on: they may be at the same place)
    if (showDensityOverlays.value) listRecentTracks(event, touch);
    if (!protectionAreasVisible.value || !props.showProtectionAreas) return;
    const extent = getExtent();
    if (!intersects(extent, swissExtent)) return;
    const canvas = map!.getContainer();
    respecterCestProtegerService
      .identify(
        fromLonLat([event.lngLat.lng, event.lngLat.lat]) as [number, number],
        extent,
        canvas.clientWidth,
        canvas.clientHeight,
        $language.current!
      )
      .then(({ data }) => {
        if (data.results?.length) {
          // if there are several results, then there must be an area and an allowed path. select area
          swissProtectionAreaData.value =
            data.results.find((result: { geometry: { type: string } }) => result.geometry.type === 'MultiPolygon') ??
            data.results[0];
          swissWindowEl.value!.show();
        }
      });
  }
}

// with a finger, the second tap of a double tap zooms: wait for it
let tapTimeout: ReturnType<typeof setTimeout> | undefined;
function onMapClick(event: MapMouseEvent) {
  clearTimeout(tapTimeout);
  if (isTouch(event)) {
    tapTimeout = setTimeout(() => onClick(event), 250);
  } else {
    onClick(event);
  }
}

// --- the "Tracks" and "Routes" overlays ---

type TrackEntry = { document: DensityTrack; type: DensityType; geometry: Geometry };

// the overlays are on every map, except when comparing two versions of a document
const showDensityOverlays = computed(() => tracksOverlayEnabled && !props.oldDocument && !props.newDocument);
// off by default: they are an opt-in addition, not a change to the look of the map
const densityEnabled = reactive<Record<DensityType, boolean>>({
  outing: showDensityOverlays.value && !!initialSettings.overlays?.includes('outing'),
  route: showDensityOverlays.value && !!initialSettings.overlays?.includes('route'),
});
// set when the API answers that the overlays are turned off: they are no longer offered
const densityUnavailable = ref(false);
// the tracks drawn, by key, with the ones of the panel
const tracks = new Map<string, TrackEntry>();
// the tracks under a click or a tap, to choose from; only the most recent ones (a place too busy to draw its tracks)
const trackPanelEntries = shallowRef<TrackEntry[]>([]);
const trackPanelTruncated = ref(false);
// how many documents there are in all, when the API knows, and whether there are even more
const trackPanelCount = ref<{ count: number; capped: boolean } | null>(null);
// false just after a tap opened the panel: the click that follows it would land on the panel
const trackPanelReady = ref(true);
// the track under the pointer, and how many others are there
const trackTooltip = ref<{ document: DensityTrack; others: number } | null>(null);
let trackTooltipMarker: Marker | null = null;
let highlightedTrack: TrackEntry | null = null;
// what each overlay shows (as a heatmap or as its tracks), its request, and the request that runs
const shownDensity: Partial<Record<DensityType, string>> = {};
const densityRequests: Partial<Record<DensityType, AbortController>> = {};
// only the answer to the latest request of an overlay is displayed: they can arrive out of order
const densityRequestIds: Record<DensityType, number> = { outing: 0, route: 0 };

const densityFilters = (type: DensityType) => (type === 'outing' ? props.tracksFilters : props.routesFilters) ?? {};

function trackSwatchStyle(document: DensityTrack) {
  const { trackColor, casingColor } = DENSITY_OVERLAYS[document.type === 'o' ? 'outing' : 'route'];
  return { background: trackColor, borderColor: casingColor };
}

// the track drawn again on top, thicker
function highlightTrack(entry: TrackEntry | null) {
  highlightedTrack = entry;
  (map?.getSource('track-highlight') as GeoJSONSource | undefined)?.setData(
    entry ? { type: 'Feature', geometry: entry.geometry, properties: { type: entry.type } } : EMPTY_COLLECTION
  );
}

function hideTrackTooltip() {
  trackTooltip.value = null;
  trackTooltipMarker?.remove();
}

// the entries of the tracks of an answer of the API, in longitude, latitude
const trackEntries = (type: DensityType, documents: DensityTrack[]) =>
  documents.map((document) => ({
    document,
    type,
    geometry: geometryToLonLat(JSON.parse(document.geometry.geom_detail) as Geometry & { coordinates: Position[] }),
  }));

const trackKey = (entry: TrackEntry) => `track:${entry.type}:${entry.document.document_id}`;

function showDensity(type: DensityType, heatmap: boolean) {
  map?.setLayoutProperty(`heatmap-${type}`, 'visibility', visibility(heatmap));
  for (const part of ['casing', 'line']) {
    map?.setLayoutProperty(`tracks-${type}-${part}`, 'visibility', visibility(!heatmap));
  }
}

function hideDensity(type: DensityType) {
  map?.setLayoutProperty(`heatmap-${type}`, 'visibility', 'none');
  for (const part of ['casing', 'line']) map?.setLayoutProperty(`tracks-${type}-${part}`, 'visibility', 'none');
}

function cancelDensityRequest(type: DensityType) {
  delete shownDensity[type];
  densityRequests[type]?.abort();
  delete densityRequests[type];
}

function setDensityOverlay(type: DensityType, enabled: boolean) {
  if (densityEnabled[type] === enabled) return;
  densityEnabled[type] = enabled;
  if (enabled) {
    updateDensityOverlay(type);
  } else {
    cancelDensityRequest(type);
    hideDensity(type);
    closeTrackPanel();
  }
}

function toggleDensityOverlay(type: DensityType) {
  setDensityOverlay(type, !densityEnabled[type]);
  storeSetting({ overlays: DENSITY_TYPES.filter((item) => densityEnabled[item]) });
  writeSettingsToUrl();
}

async function updateDensityOverlay(type: DensityType) {
  if (!densityEnabled[type] || !map) return;
  const overlay = DENSITY_OVERLAYS[type];
  // the zooms of OpenLayers, which the API knows
  const tracksShown = Math.round(map.getZoom() + 1) >= DENSITY_TRACKS_MIN_ZOOM;
  // a box on a grid, so that small moves of the map ask for the same thing: the answer is already there (and the
  // browser keeps it, the API lets it)
  const params = { ...densityFilters(type), bbox: snapExtent(getExtent()).join(',') };
  const key = JSON.stringify([params, $language.current, tracksShown]);
  if (key === shownDensity[type]) return;
  const requestId = ++densityRequestIds[type];
  const isCurrent = () => requestId === densityRequestIds[type] && densityEnabled[type] && !!map;

  cancelDensityRequest(type);
  const { signal } = (densityRequests[type] = new AbortController());
  try {
    if (tracksShown) {
      const { data } = await overlay.getTracks({ ...params, pl: $language.current }, signal);
      if (!isCurrent()) return;
      if (!data.truncated) {
        closeTrackPanel();
        [...tracks.keys()].filter((k) => k.startsWith(`track:${type}:`)).forEach((k) => tracks.delete(k));
        const entries = trackEntries(type, data.documents);
        entries.forEach((entry) => tracks.set(trackKey(entry), entry));
        (map!.getSource(`tracks-${type}`) as GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: entries.map((entry) => ({
            type: 'Feature',
            geometry: entry.geometry,
            properties: { key: trackKey(entry) },
          })),
        });
        showDensity(type, false);
        shownDensity[type] = key;
        return;
      }
      // too many tracks to draw them: their density, as when zoomed out
    }
    // the size of the cells comes from the box, on the server
    const { data } = await overlay.getHeatmap(params, signal);
    if (!isCurrent()) return;
    closeTrackPanel();
    const maxCount = Math.max(1, ...data.buckets.map((bucket) => bucket.count));
    (map!.getSource(`heatmap-${type}`) as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: data.buckets.map((bucket) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: toLonLat([bucket.x, bucket.y]) },
        properties: { weight: heatmapWeight(bucket.count, maxCount) },
      })),
    });
    showDensity(type, true);
    shownDensity[type] = key;
  } catch (error) {
    // a request replaced by a newer one, or given up: nothing to tell
    if (signal.aborted) return;
    // the API turns the overlays off when they load the servers too much (TRACKS_OVERLAY_ENABLED): so does the map
    if ((error as { response?: { status?: number } } | null)?.response?.status === 503) {
      densityUnavailable.value = true;
      turnOffDensityOverlays();
    }
    // any other error: the overlays are non-critical, leave the map usable
  }
}

const updateDensityOverlays = () => DENSITY_TYPES.forEach(updateDensityOverlay);

function turnOffDensityOverlays() {
  const wereOn = DENSITY_TYPES.some((type) => densityEnabled[type]);
  for (const type of DENSITY_TYPES) {
    densityEnabled[type] = false;
    cancelDensityRequest(type);
    hideDensity(type);
  }
  closeTrackPanel();
  if (wereOn) {
    toast({ message: $gettext('The Outings and Routes overlays are temporarily unavailable'), type: 'is-warning' });
  }
}

let trackPanelTimeout: ReturnType<typeof setTimeout> | undefined;
let recentRequest: AbortController | undefined;

function openTrackPanel(entries: TrackEntry[], touch: boolean) {
  trackPanelEntries.value = entries;
  trackPanelTruncated.value = false;
  trackPanelCount.value = null;
  hideTrackTooltip();
  // a touch screen sends a click after the tap, where the panel now is: it must not open the first track
  clearTimeout(trackPanelTimeout);
  trackPanelReady.value = !touch;
  if (touch) trackPanelTimeout = setTimeout(() => (trackPanelReady.value = true), 500);
}

function closeTrackPanel() {
  recentRequest?.abort();
  trackPanelEntries.value = [];
  trackPanelTruncated.value = false;
  trackPanelCount.value = null;
  highlightTrack(null);
}

// How far from a click, in pixels, the documents are listed when the overlay is a heatmap, and how many (the most
// recent ones; the API says when there are more)
const RECENT_CLICK_RADIUS = 20;
const RECENT_TOUCH_CLICK_RADIUS = 32;
const RECENT_COUNT = 30;

// A click on the density of an overlay (too many tracks to draw them): the most recent documents there, in the panel
// of the tracks. Returns whether there is a density under the click.
function listRecentTracks(event: MapMouseEvent, touch: boolean) {
  const types = DENSITY_TYPES.filter(
    (type) => densityEnabled[type] && map!.getLayoutProperty(`heatmap-${type}`, 'visibility') === 'visible'
  );
  if (!types.length) return false;

  const radius = touch ? RECENT_TOUCH_CLICK_RADIUS : RECENT_CLICK_RADIUS;
  const { x, y } = event.point;
  const corners = [map!.unproject([x - radius, y + radius]), map!.unproject([x + radius, y - radius])];
  const bbox = corners
    .flatMap(({ lng, lat }) => fromLonLat([lng, lat]))
    .map(Math.round)
    .join(',');

  recentRequest?.abort();
  const { signal } = (recentRequest = new AbortController());
  Promise.all(
    types.map(async (type) => {
      const { data } = await DENSITY_OVERLAYS[type].getTracks(
        { ...densityFilters(type), bbox, pl: $language.current, recent: RECENT_COUNT },
        signal
      );
      return {
        entries: trackEntries(type, data.documents),
        truncated: data.truncated,
        count: data.count,
        capped: data.count_capped ?? false,
      };
    })
  )
    .then((answers) => {
      const entries = answers.flatMap((answer) => answer.entries);
      if (signal.aborted || !entries.length) return;
      entries.forEach((entry) => tracks.set(trackKey(entry), entry));
      openTrackPanel(
        tracksIn(entries.map((entry) => ({ layer: { id: '' }, properties: { key: trackKey(entry) } }))),
        touch
      );
      const truncated = answers.filter((answer) => answer.truncated);
      trackPanelTruncated.value = truncated.length > 0;
      // the total of the types that have more, if the API knows all of them
      trackPanelCount.value = truncated.every((answer) => answer.count !== undefined)
        ? {
            count: truncated.reduce((sum, answer) => sum + (answer.count ?? 0), 0),
            capped: truncated.some((answer) => answer.capped),
          }
        : null;
    })
    // the overlays are not critical: the click does nothing
    .catch(() => undefined);
  return true;
}

// --- geolocation and places ---

function centerOnGeolocation() {
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => map?.jumpTo({ center: [coords.longitude, coords.latitude], zoom: TRACKING_INITIAL_ZOOM }),
    () => undefined,
    { enableHighAccuracy: true }
  );
}

function searchRecenterOnPropositions(event: Event) {
  const query = (event.target as HTMLInputElement).value;
  if (query?.length >= 3) {
    const { lng, lat } = map!.getCenter();
    recenterPropositions.value = photon.getPropositions(query, $language.current!, [lng, lat]);
    showRecenterOnPropositions.value = true;
  } else {
    showRecenterOnPropositions.value = false;
  }
}

function clearRecenterOnPropositions() {
  setTimeout(() => {
    showRecenterOnPropositions.value = false;
    recenterOnPropositionsInputEl.value!.value = '';
  }, 200);
}

// https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/js/map/search.js#L194
function recenterOn(item: PhotonFeature) {
  const extent = item.properties.extent;
  if (extent) {
    // from W N E S to W S E N
    const bounds: Extent = [extent[0], Math.min(extent[1], extent[3]), extent[2], Math.max(extent[1], extent[3])];
    map!.fitBounds(bounds, { maxZoom: MIN_ZOOM_LEVEL, padding: 0, duration: 0 });
  } else {
    map!.jumpTo({ center: item.geometry.coordinates as [number, number], zoom: 15 });
  }
  showRecenterOnPropositions.value = false;
}

// --- the stops of the public transport (NearbyStopsSection) ---

// the stop: a document or a waypoint of the map
const findStop = (stopId: number) =>
  features.find(
    (feature) => feature.part === 'point' && feature.group !== 'images' && feature.document.document_id === stopId
  ) ?? null;

/** Highlights a stop, with its name */
function highlightStop(stopId: number) {
  stopKey.value = findStop(stopId)?.key ?? null;
  renderDocuments();
}

/** Back to the normal style of the stops */
function resetStopStyles() {
  stopKey.value = null;
  renderDocuments();
}

/** Zoom and move the map to a stop */
function goAndZoomOnStop(stopId: number) {
  const stop = findStop(stopId);
  if (stop && map) {
    map.stop();
    map.easeTo({
      center: (stop.geometry as Point).coordinates as [number, number],
      zoom: Math.max(map.getZoom(), MIN_ZOOM_LEVEL),
      duration: 300,
    });
  }
}

// --- the protection areas ---

// the page is told once about protection areas in the view: by the Swiss check of the first view, or by the first
// biodiv-sports load that answers (after a failed load, the view of the next one is checked)
let protectionAreasNotified = false;
let swissProtectionAreasChecked = false;
let biodivSportsAreasChecked = false;
// the extents (EPSG:3857) of the biodiv-sports areas loaded, or being loaded, and the areas, by id
const protectionAreasExtents: Extent[] = [];
const biodivAreas = new Map<number, Feature>();

function notifyProtectionAreas() {
  if (!protectionAreasNotified) {
    protectionAreasNotified = true;
    emit('has-protection-area');
  }
}

const contains = (outer: Extent, inner: Extent) =>
  outer[0] <= inner[0] && outer[1] <= inner[1] && outer[2] >= inner[2] && outer[3] >= inner[3];

// the areas of the view and half a view around it: small moves and zooming in reuse them
function loadProtectionAreas() {
  // offline, the request fails, and its extent would never be asked again
  if (!map || !props.showProtectionAreas || !protectionAreasVisible.value || !online.value) return;
  const view = getExtent();
  if (protectionAreasExtents.some((loaded) => contains(loaded, view))) return;
  const margin = (view[2] - view[0]) / 2;
  const extent: Extent = [view[0] - margin, view[1] - margin, view[2] + margin, view[3] + margin];
  protectionAreasExtents.push(extent);

  const areas = biodivSportsService
    .fetchData(extentToLonLat(extent), props.biodivSportsActivities ?? undefined, $language.current!)
    .then((response) => {
      const results = (response as { data?: { results?: BiodivResult[] } } | undefined)?.data?.results ?? [];
      for (const result of results) {
        biodivAreas.set(result.id, {
          type: 'Feature',
          geometry: result.geometry,
          properties: {
            biodivData: JSON.stringify({
              source: 'biodivsports',
              title: result.name,
              description: result.description,
              infoUrl: result.info_url,
              kmlUrl: result.kml_url,
              period: result.period,
            }),
          },
        });
      }
      (map?.getSource('protection') as GeoJSONSource | undefined)?.setData({
        type: 'FeatureCollection',
        features: [...biodivAreas.values()],
      });
      return results;
    })
    .catch((error) => {
      // loaded again on the next move
      map?.once('moveend', () => protectionAreasExtents.splice(protectionAreasExtents.indexOf(extent), 1));
      throw error;
    });

  if (!swissProtectionAreasChecked) {
    swissProtectionAreasChecked = true;
    if (intersects(view, swissExtent)) {
      respecterCestProtegerService.hasArea(view).then(
        (hasArea) => hasArea && notifyProtectionAreas(),
        () => {}
      );
    }
  }

  if (!biodivSportsAreasChecked) {
    const viewLonLat = extentToLonLat(view);
    areas.then(
      (results) => {
        biodivSportsAreasChecked = true;
        if (results.some((result) => intersects(geometryExtent(result.geometry), viewLonLat))) {
          notifyProtectionAreas();
        }
      },
      () => {}
    );
  }
}

// --- full screen ---

const fullScreenElement = () =>
  (props.fullScreenElementId && document.getElementById(props.fullScreenElementId)) || rootElementEl.value!;

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    fullScreenElement().requestFullscreen();
  }
}

function onFullscreenChange() {
  const fullscreen = !!document.fullscreenElement && document.fullscreenElement === fullScreenElement();
  if (fullscreen === isFullscreen.value) return;
  isFullscreen.value = fullscreen;
  showLayerSwitcher.value = false;
  // the 3D view goes back to its documents after a resize (resetCamera)
  if (!is3d.value) setTimeout(() => fitMapToDocuments(), 0);
}

// --- the elevation profile ---

// the point under the cursor of the elevation profile (ElevationProfile.vue): a yellow point in 2D; on the terrain,
// one of the colour of the track, or in the air on a flight
let profileMarker: Marker | null = null;
// the last cursor event: an older one that waited for the terrain is dropped
let cursorEvent = 0;

function profileMarkerElement(): HTMLElement {
  const element = document.createElement('div');
  element.style.cssText = `width: 10px; height: 10px; border-radius: 50%; background: ${DOCUMENT_COLOR};
    border: 1px solid ${LINE_CASING_COLOR}; pointer-events: none`;
  return element;
}

function hideProfileCursor() {
  flightLayers?.cursor(null);
  profileMarker?.remove();
  profileMarker = null;
  (map?.getSource('profile') as GeoJSONSource | undefined)?.setData(EMPTY_COLLECTION);
}

async function onElevationProfile(event: unknown) {
  const { action, coord } = event as { action: string; coord?: number[] };
  if (!map) return;
  const asked = ++cursorEvent;
  if (action === 'cursor_end') {
    hideProfileCursor();
  } else if (action === 'cursor_move' && coord) {
    // the profile gives EPSG:3857 coordinates
    const lngLat = toLonLat([coord[0], coord[1]]) as [number, number];
    if (is3d.value) {
      const inFlight = flightLayers ? await flightLayers.cursor(lngLat) : false;
      if (asked !== cursorEvent || !map) return;
      if (inFlight) {
        profileMarker?.remove();
        profileMarker = null;
      } else {
        profileMarker ??= new Marker({ element: profileMarkerElement() });
        profileMarker.setLngLat(lngLat).addTo(map);
      }
    } else {
      (map.getSource('profile') as GeoJSONSource).setData({ type: 'Point', coordinates: lngLat });
    }
    if (!map.getBounds().contains(lngLat)) map.easeTo({ center: lngLat, duration: 300 });
  }
}

// --- 3D ---

let shownMarkers: Marker[] = [];
let flightLayers: FlightLayers | null = null;
// changes with the documents of the 3D view: what is still being read for the previous ones is dropped
let documents3dVersion = 0;
// where the 3D view opened, and the 2D view to go back to
let bounds3d: Extent | null = null;
let view2d: { center: [number, number]; zoom: number } | null = null;

// the country of the documents, by their areas: that of the first one in a country (or a region) we have layers for
function documentsCountry(): string | undefined {
  for (const document of props.documents ?? []) {
    const country = countryOfAreas((document.areas ?? []).map((area) => area.document_id!));
    if (country) return country;
  }
  return undefined;
}

const isPoint = (feature: DocumentFeature) => feature.geometry.type === 'Point';

function marker3d(feature: DocumentFeature, interactive: boolean): Marker3d | null {
  const { document } = feature;
  const icon = getDocumentIcon(document);
  if (!icon) return null;
  return {
    lonLat: (feature.geometry as Point).coordinates as [number, number],
    title: title(document),
    ...icon,
    to: interactive
      ? { name: $documentUtils.getDocumentType(document.type), params: { id: document.document_id } }
      : null,
  };
}

const isList = computed(() => (props.documents?.length ?? 0) > 1);

// the lines of the documents, and the markers: the waypoints, and the point of the document itself, a waypoint always
// (among its child waypoints), another document only when there is nothing else to show (no track, no waypoint). In a
// list, each document has its marker, which opens it: a result without a track must not disappear because another has one.
function documents3d() {
  const documentFeatures3d = features.filter((feature) => feature.group === 'documents');
  const lines: FeatureCollection = {
    type: 'FeatureCollection',
    features: documentFeatures3d
      .filter((feature) => !isPoint(feature))
      .map((feature) => ({
        type: 'Feature',
        // paragliding tracks: their flights are drawn in the air
        properties: { paragliding: !!feature.document.activities?.includes('paragliding') },
        geometry: feature.geometry,
      })),
  };
  const waypointMarkers = features
    .filter((feature) => feature.group === 'waypoints' && isPoint(feature))
    .map((feature) => marker3d(feature, true));
  const points = documentFeatures3d.filter(isPoint);
  const markers = [
    ...points
      .filter(
        (feature) => isList.value || feature.document.type === 'w' || !(lines.features.length || waypointMarkers.length)
      )
      .map((feature) => marker3d(feature, isList.value)),
    ...waypointMarkers,
  ].filter((marker): marker is Marker3d => !!marker);
  return { lines, markers };
}

function addMarkers(created: MapLibreMap, markers: Marker3d[]) {
  shownMarkers.push(
    ...markers.map((marker) => {
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
      return new Marker({ element, anchor: 'bottom', subpixelPositioning: true })
        .setLngLat(marker.lonLat)
        .addTo(created);
    })
  );
}

// an outing has no waypoint of its own: the 3D view also shows those of its routes (access, hut, summit), read when
// it opens (a request per route, 3 routes at most)
async function addRouteWaypoints(shown: Marker3d[]) {
  // a list has the markers of its results: the routes of 3 of its outings would be an arbitrary pick
  if (isList.value) return;
  const routeIds = [
    ...new Set(
      (props.documents ?? [])
        .filter((document) => document.type === 'o')
        .flatMap((outing) => outing.associations?.routes?.map((route) => route.document_id) ?? [])
        .filter((id): id is number => id !== undefined)
    ),
  ].slice(0, 3);
  if (!routeIds.length) return;
  const opened = map;
  const version = documents3dVersion;
  const routes = await Promise.all(
    routeIds.map((id) =>
      Promise.resolve((c2c.route as DocumentService).get(id, $language.current!)).then(
        (response) => response.data as C2cDocument,
        () => null
      )
    )
  );
  if (!is3d.value || map !== opened || !map || version !== documents3dVersion) return;
  const ids = new Set(shown.map((marker) => (marker.to as { params?: { id?: number } } | null)?.params?.id));
  const markers = routes
    .flatMap((route) => route?.associations?.waypoints ?? [])
    .filter(isNotVirtual)
    .filter((waypoint) => !ids.has(waypoint.document_id) && ids.add(waypoint.document_id))
    .flatMap((waypoint) => documentFeatures(waypoint, 'waypoints'))
    .filter(isPoint)
    .map((feature) => marker3d(feature, true))
    .filter((marker): marker is Marker3d => !!marker);
  addMarkers(map, markers);
}

// paragliding: the flights in the air, the walk on the ground. The search (terrain tiles) and deck.gl start as soon as
// the view opens; the track is only drawn once split, so that it does not first lie on the ground then jump into the
// air. If the search itself takes too long, the track is drawn on the ground meanwhile.
const FLIGHTS_WAIT = 5000;
async function showFlights(created: MapLibreMap, lines: FeatureCollection) {
  const source = () => created.getSource('documents-3d') as GeoJSONSource | undefined;
  const version = documents3dVersion;
  const opened = () => map === created && is3d.value && version === documents3dVersion;
  if (!hasParaglidingTrack(lines)) {
    source()?.setData(lines);
    return;
  }
  source()?.setData(withoutParaglidingTracks(lines));
  loadFlightLayers().catch(() => undefined);
  const fallback = setTimeout(() => opened() && source()?.setData(lines), FLIGHTS_WAIT);
  const flights = await findFlights(lines, EXAGGERATION).catch(() => null);
  clearTimeout(fallback);
  if (!opened()) return;
  // deck.gl may fail (no WebGL feature it needs, a MapLibre it does not know): the track then stays draped
  const added = flights && (await addFlightLayers(created, flights).catch(() => null));
  if (!opened()) {
    added?.remove();
    return;
  }
  if (!flights || !added) {
    source()?.setData(lines);
    return;
  }
  flightLayers = added;
  source()?.setData(flights.documents);
  (created.getSource('flight-shadows') as GeoJSONSource).setData(flights.shadows);
}

// the extent of the documents (or of the view), so that the 3D view opens close to them
function bounds3dOf(markers: Marker3d[], lines: FeatureCollection): Extent {
  let extent = [...lines.features.map((feature) => geometryExtent(feature.geometry))].reduce(extend, EMPTY);
  markers.forEach(({ lonLat: [x, y] }) => (extent = extend(extent, [x, y, x, y])));
  if (!isFiniteExtent(extent)) return getExtent('EPSG:4326');
  // a single point: about 2 km around it
  const margin = extent[0] === extent[2] && extent[1] === extent[3] ? 0.02 : 0;
  return [extent[0] - margin, extent[1] - margin, extent[2] + margin, extent[3] + margin];
}

// back to the starting view of the 3D view, on the documents
function resetCamera() {
  if (!map || !bounds3d) return;
  const camera = map.cameraForBounds(bounds3d, { ...FIT_OPTIONS_3D, bearing: 0 });
  if (camera) map.jumpTo({ ...camera, pitch: PITCH_3D });
}

function setRotation(enabled: boolean) {
  if (!map) return;
  for (const handler of [map.dragRotate, map.touchPitch, map.keyboard]) {
    if (enabled) handler.enable();
    else if (handler === map.keyboard) map.keyboard.disableRotation();
    else handler.disable();
  }
  if (enabled) map.touchZoomRotate.enableRotation();
  else map.touchZoomRotate.disableRotation();
  if (enabled) map.keyboard.enableRotation();
}

// the documents of a list that changed (another page of the results), while the 3D view is open
function redraw3d() {
  if (!map) return;
  const { lines, markers } = documents3d();
  documents3dVersion++;
  shownMarkers.forEach((marker) => marker.remove());
  shownMarkers = [];
  flightLayers?.remove();
  flightLayers = null;
  (map.getSource('flight-shadows') as GeoJSONSource).setData(EMPTY_COLLECTION);
  addMarkers(map, markers);
  showFlights(map, lines);
}

function open3d() {
  if (!map) return;
  const created = map;
  const { lng, lat } = map.getCenter();
  view2d = { center: [lng, lat], zoom: map.getZoom() };
  const { lines, markers } = documents3d();
  documents3dVersion++;
  // a list of documents (search results) can be anywhere: the 3D view tilts the view of the map, it does not fit them
  bounds3d = isList.value ? getExtent('EPSG:4326') : bounds3dOf(markers, lines);
  const country = baseLayers.find((layer) => layer.title === base.value)?.country ?? documentsCountry();
  // the same layer in 3D when it has one there, else the orthophoto of its country
  base3d.value = (
    baseLayers3d.find((layer) => layer.title === base.value) ??
    nationalOrthoLayers.find((layer) => layer.country === country) ??
    orthoLayerAt((bounds3d[0] + bounds3d[2]) / 2, (bounds3d[1] + bounds3d[3]) / 2) ??
    worldLayer
  ).title;
  is3d.value = true;
  setHoveredKey(null);
  closeTrackPanel();
  hideTrackTooltip();
  hideProfileCursor();
  map.setTerrain({ source: 'terrain', exaggeration: EXAGGERATION });
  map.setSky({ 'sky-color': '#9cc9f0', 'horizon-color': '#e6eef5', 'horizon-fog-blend': 0.6 });
  setRotation(true);
  showLayers();
  addMarkers(created, markers);
  showFlights(created, lines);
  resetCamera();
  addRouteWaypoints(markers);
}

function close3d() {
  if (!map) return;
  is3d.value = false;
  // back in 2D, the layer shown before 3D, or that of the category chosen in 3D (chooseBase)
  shownMarkers.forEach((marker) => marker.remove());
  shownMarkers = [];
  flightLayers?.remove();
  flightLayers = null;
  hideProfileCursor();
  (map.getSource('documents-3d') as GeoJSONSource).setData(EMPTY_COLLECTION);
  (map.getSource('flight-shadows') as GeoJSONSource).setData(EMPTY_COLLECTION);
  map.setTerrain(null);
  setRotation(false);
  showLayers();
  // a list stays where it is (its box filters the results), a document goes back to its 2D view
  map.jumpTo({ ...(isList.value ? {} : view2d), bearing: 0, pitch: 0 });
  bounds3d = null;
  updateDensityOverlays();
}

function resetNorth() {
  map?.easeTo({ bearing: 0, pitch: PITCH_3D });
}

// after the map changed size (full screen left or entered, map pinned to a side or unpinned), the 3D view goes back to
// its documents, as the 2D map fits its documents again
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
let stopScrollPassthrough: (() => void) | null = null;
let lastSize = '';
const resizeObserver = new ResizeObserver(([entry]) => {
  const size = `${Math.round(entry.contentRect.width)}x${Math.round(entry.contentRect.height)}`;
  // the first call is the size at mount: nothing to reset
  if (lastSize && size !== lastSize && is3d.value) {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resetCamera, 200);
  }
  lastSize = size;
});

// --- lifecycle ---

watch(
  [
    base,
    base3d,
    slopes,
    slopesOpacity,
    protectionAreasVisible,
    protectionAreasOpacity,
    shading,
    online,
    shownBase,
    underBase,
    shownSlopes,
    shadingStrength,
  ],
  () => {
    showLayers();
    loadProtectionAreas();
  }
);
watch([is3d, base3d], () => showVectorMap());

// the network lost in 3D: back to the 2D map, whose tiles may be downloaded
watch(online, (isOnline) => {
  if (!isOnline && is3d.value) close3d();
});

// the network back: the layer chosen before, its tiles that failed without the network asked again
watch(online, (isOnline) => {
  if (!isOnline) return;
  seenOnline.value = true;
  offlineBase.value = null;
  const layer = baseLayers.find((item) => item.title === base.value);
  const source = layer && (map?.getSource(layer.title) as RasterTileSource | undefined);
  source?.setTiles?.(layer!.tiles);
});

// deep 1: also when documents are added to or removed from the array, as Vue 2 array watchers did
watch(
  () => props.documents,
  (documents) => {
    drawDocumentMarkers();
    if (is3d.value) redraw3d();
    // the results of the search came after the map: it fits them, unless the user moved it meanwhile
    if (fitOnFirstDocuments && documents?.length) {
      fitOnFirstDocuments = false;
      fitMapToDocuments(true);
    }
  },
  { deep: 1 }
);

watch(filterDocumentsWithMap, () => sendBoundsToUrl());

// what the user changes is kept on this device, for the next document pages: only that setting, not the others the page
// shows (those of an old shared link). The base layer (its category), the slopes and the protection areas change only by a
// click; the overlays are stored by their toggle, as they are also turned off when unavailable (that is not a choice to
// keep). The layers the map shows by itself (in 3D, without a network, in the country of a document) are not stored
function storeSetting(change: Parameters<typeof storeMapSettings>[0]) {
  if (props.rememberSettings) storeMapSettings(change, baseLayers[0].title);
}

// a click on a base layer, in 2D or in 3D: its category is kept. A layer chosen in 3D that 2D has not (Sentinel-2) gives
// 2D the layer of its category
function chooseBase(title: string) {
  // offline: for now only (offlineBase)
  if (!online.value && !is3d.value) {
    offlineBase.value = title;
    return;
  }
  const category = categoryOf(title);
  if (is3d.value) base3d.value = title;
  if (baseLayers.some((layer) => layer.title === title)) base.value = title;
  else if (category) base.value = baseLayerOf(category, documentsCountry());
  storeSetting({ category });
}

// another document in the same map (the page of a document followed by another one): the layer of its country
watch(documentsCountry, (country) => {
  if (props.rememberSettings && !parseMapUrl(route.query).base)
    base.value = baseLayerOf(storedLayerCategory() ?? 'topo', country);
});
watch(slopes, (value) => storeSetting({ slopes: value }));
watch(protectionAreasVisible, (value) => storeSetting({ protection: value }));

// On a list, the settings are in the query of the page (the other parameters are kept). The page is replaced, not added to
// the history: it is still the same results
const settingsInUrl = () => JSON.stringify(MAP_URL_KEYS.map((key) => route.query[key] ?? null));
function writeSettingsToUrl() {
  if (!props.syncUrl) return;
  const query = withMapUrl(
    route.query,
    {
      base: base.value,
      slopes: slopes.value,
      overlays: DENSITY_TYPES.filter((type) => densityEnabled[type]),
      protection: !props.showProtectionAreas || protectionAreasVisible.value,
      pin: '',
    },
    baseLayers[0].title
  );
  if (JSON.stringify(MAP_URL_KEYS.map((key) => query[key] ?? null)) !== settingsInUrl()) router.replace({ query });
}
watch([base, slopes, protectionAreasVisible], writeSettingsToUrl);

// the settings of the query changed (back, a link to another list...): the map follows
watch(settingsInUrl, () => {
  if (!props.syncUrl) return;
  const settings = {
    base: baseLayers[0].title,
    slopes: [],
    overlays: [],
    protection: true,
    ...parseMapUrl(route.query),
  };
  base.value = settings.base;
  if (settings.slopes.join() !== slopes.value.join()) slopes.value = settings.slopes;
  protectionAreasVisible.value = props.showProtectionAreas && settings.protection;
  for (const type of DENSITY_TYPES)
    setDensityOverlay(type, showDensityOverlays.value && settings.overlays.includes(type));
});

// the filters are compared by content: the parent may give a new (but identical) object each time the route changes
watch(
  () => JSON.stringify(props.tracksFilters),
  () => updateDensityOverlay('outing')
);
watch(
  () => JSON.stringify(props.routesFilters),
  () => updateDensityOverlay('route')
);

watch(
  () => props.highlightedDocument,
  (document) => setHoveredKey(document ? documentKey(document) : null)
);

onMounted(() => {
  let created: MapLibreMap;
  try {
    created = new MapLibreMap({
      container: mapElementEl.value!,
      // at most 2 device pixels per CSS pixel: the 3x screens of phones would ask 2.25 times the tiles and fill rate
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      style: style(),
      minZoom: -1,
      maxZoom: MAX_ZOOM,
      maxPitch: 85,
      // the markers are shown at once, as the rest
      fadeDuration: 0,
      attributionControl: false,
      // no rotation in 2D (setRotation); in 3D, the right button or Ctrl + drag also tilts the view, as the 3D view did
      // before it moved into this map
      dragRotate: false,
      touchPitch: false,
    });
  } catch {
    // no WebGL 2: no map
    return;
  }
  map = created;
  vectorShown = null;
  loaded = new Promise((resolve) => created.once('load', () => resolve()));
  setRotation(false);

  created.addControl(new ScaleControl(), 'bottom-right');
  created.on('rotate', () => (bearing.value = created.getBearing()));
  created.on('load', () => {
    showLayers();
    loadProtectionAreas();
    // the overlays asked for by the URL
    updateDensityOverlays();
  });
  created.on('moveend', () => {
    viewExtent.value = getExtent('EPSG:4326');
    // in 3D, the box of what is seen, not too far from the center
    sendBoundsToUrl();
    if (is3d.value) return;
    updateEditMapLink();
    emitMoveEvent();
    loadProtectionAreas();
  });
  created.on('mousemove', onPointerMove);
  created.on('mouseout', onPointerOut);
  if (showDensityOverlays.value) {
    // it must not catch the pointer, or hovering the track would hide it
    trackTooltipMarker = new Marker({ element: trackTooltipEl.value!, anchor: 'bottom', offset: [0, -12] });
    created.on('moveend', debounce(updateDensityOverlays, DENSITY_FETCH_DEBOUNCE));
  }
  // moved by the user (a move by code has no original event): the results that come later do not move it back
  created.on('movestart', (event) => {
    if (event.originalEvent) fitOnFirstDocuments = false;
  });
  created.on('click', onMapClick);
  created.on('dblclick', () => clearTimeout(tapTimeout));

  drawDocumentMarkers();
  const bbox = route.query.bbox ? String(route.query.bbox).replace('%252C', ',').split(',').map(Number) : null;
  if (bbox && isFiniteExtent(bbox)) {
    const camera = created.cameraForBounds(extentToLonLat(bbox), { padding: 0 });
    if (camera) created.jumpTo(camera);
  } else if (props.initialExtent) {
    fit(props.initialExtent);
  } else {
    // no document yet (a search still loading): the map fits its first results, the areas and waypoints of the search
    // excepted, which the map already fits
    fitOnFirstDocuments = !props.documents?.length && !route.query.a && !route.query.w;
    fitMapToDocuments(true);
  }
  viewExtent.value = getExtent('EPSG:4326');
  updateEditMapLink();

  document.addEventListener('fullscreenchange', onFullscreenChange);
  // scrolling the page past the map does not zoom or pan it; nothing to scroll in full screen
  stopScrollPassthrough = scrollPassthrough(mapElementEl.value!, rootElementEl.value!, () => !isFullscreen.value);
  bus.on('elevation_profile', onElevationProfile);
  resizeObserver.observe(rootElementEl.value!);
});

onBeforeUnmount(() => {
  DENSITY_TYPES.forEach(cancelDensityRequest);
  resizeObserver.disconnect();
  clearTimeout(resizeTimer);
  clearTimeout(tapTimeout);
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  stopScrollPassthrough?.();
  stopScrollPassthrough = null;
  bus.off('elevation_profile', onElevationProfile);
  flightLayers?.remove();
  flightLayers = null;
  map?.remove();
  map = null;
});

// what the pages use
defineExpose({
  fitMapToDocuments,
  getExtent,
  highlightStop,
  goAndZoomOnStop,
  recenterOnDocuments,
  resetStopStyles,
  // after the size of the map changed
  resize: () => map?.resize(),
});
</script>

<style scoped>
.c2c-map {
  position: relative;
  width: 100%;
  height: 100%;
}

.c2c-map-canvas {
  width: 100%;
  height: 100%;
  /* MapLibre sets a 12px font on its map: the page's one, so that the controls placed in em (the scale) are where
     they are with the others */
  font: inherit;
}

/* while the page scrolls, a touch on the map scrolls the page (see scroll-passthrough.ts): MapLibre's own touch-action
   (none) is on its canvas and its container */
.c2c-map.page-scrolling :deep(.maplibregl-canvas-container),
.c2c-map.page-scrolling :deep(.maplibregl-canvas) {
  touch-action: pan-x pan-y !important;
}

.c2c-map-compass {
  top: calc(1.5em + 3 * var(--map-button-size));
  left: 0.5em;

  /* the place of the geolocation button, which the 3D view hides */
  &.below-pin {
    top: calc(2em + 4 * var(--map-button-size));
  }
}

/* without a network: just above the layer switcher button, which it opens, where the 3D button is (not offered
   offline); the bottom row has the scale, which a narrow map widens to its left */
.c2c-map-offline-chip {
  bottom: calc(1em + var(--map-button-size));
  left: 0.5em;

  button {
    width: auto;
    padding: 0 0.6em;
    gap: 0.35em;
    background: var(--c2c-yellow);
    color: var(--c2c-text);
    font-size: 0.8rem;
    white-space: nowrap;
  }
}

/* at the top of the layer switcher: what each base layer shows without a network */
.c2c-map-offline-status {
  margin-bottom: 0.5em;
  padding: 0.4em 0.5em;
  border-radius: 4px;
  background: var(--c2c-yellow);
  color: var(--c2c-text);
  font-size: 0.8rem;

  header {
    font-weight: bold;
  }

  p {
    margin: 0;
  }
}

.c2c-map-compass-needle {
  display: inline-block;
  font-size: 0.8em;
  line-height: 1;
}

.ol-control-pin-to-top {
  top: calc(1.5em + 3 * var(--map-button-size));
  left: 0.5em;
}

.ol-control-center-on-geolocation {
  top: calc(2em + 4 * var(--map-button-size));
  left: 0.5em;
}

.ol-control-layer-switcher {
  z-index: 4;
  bottom: 0;
  left: 0;
  height: 100%;
  width: 225px;
  color: white;
  text-decoration: none;
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

/* a button: beat the .ol-control button rules */
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

:fullscreen {
  .ol-control-layer-switcher {
    width: 320px;
  }
  .ol-control-layer-switcher-layers {
    width: 300px;
    height: 100vh;
  }

  .with-elevation-profile .ol-control-layer-switcher-layers {
    /* elevation profile occupies 30% of the screen, see MapBox.vue */
    height: calc(100vh * 0.7);
    max-height: calc(100vh - 200px);
    min-height: calc(100vh - 350px);
  }
}

/* the layer thumbnails are cropped to the button */
:deep(.layer-button) {
  background-size: cover;
}

.ol-control-layer-switcher-button {
  bottom: 0.5em;
  left: 0.5em;
}

/* just above the layer switcher button */
.ol-control-3d {
  bottom: calc(1em + var(--map-button-size));
  left: 0.5em;

  /* a button of the same size as the others, with a smaller text so that two letters fit */
  span {
    font-size: 0.7em;
    font-weight: bold;
  }
}

.ol-control-use-map-as-filter {
  top: 0.5em;
  left: 3em;
  padding: 0 2px;
  background: rgba(255, 255, 255, 0.8);

  .is-info:checked + label::before {
    background-color: rgba(0, 60, 136, 0.6);
  }
}

.ol-control-recenter-on {
  top: 35px;
  left: 3em;
  opacity: 0.8;

  input {
    border-radius: 4px;
    border-style: none;
  }
}

.ol-control-recenter-on_on-top {
  top: 0.5em;
}

.ol-control-recenter-on-propositions {
  top: 57px;
  left: 3em;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px;

  li:hover {
    background: lightgrey;
    cursor: pointer;
  }
}

.ol-control-recenter-on-propositions_on-top {
  top: 27px;
}

.ol-control-edit-map {
  bottom: calc(1em + var(--map-button-size));
  right: 0.5em;

  a {
    line-height: 0.4em;
  }

  svg {
    height: 0.7em;
    vertical-align: -0.45em;
  }
}

.ol-track-tooltip {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  padding: 4px 8px;
  width: max-content;
  max-width: 320px;
  pointer-events: none;

  .track-meta {
    color: var(--c2c-grey);
    font-size: 0.85em;
  }
}

.ol-track-panel {
  position: absolute;
  z-index: 2;
  right: 0.5em;
  bottom: 0.5em;
  left: 0.5em;
  max-width: 380px;
  margin-left: auto;
  max-height: 70%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);

  header {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border-bottom: 1px solid var(--c2c-grey-lighter);
  }

  .track-panel-note {
    flex: none;
    margin: 0;
    padding: 4px 10px;
    font-size: 0.85em;
    color: var(--c2c-grey-dark);
    border-bottom: 1px solid var(--c2c-grey-lighter);
  }

  ul {
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.6em;
    padding: 6px 10px;

    &:hover {
      background: var(--c2c-hover-background);
    }

    & + li {
      border-top: 1px solid var(--c2c-grey-lightest);
    }
  }

  .track-swatch {
    flex: none;
    width: 1.4em;
    height: 0.7em;
    border: 2px solid;
    border-radius: 4px;
  }

  .track-description {
    flex: 1;
    min-width: 0;
  }

  .track-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 0.7em;
    color: var(--c2c-grey);
    font-size: 0.85em;
  }
}

@media (pointer: coarse) {
  .ol-track-panel li {
    min-height: 44px;
  }
}

.ol-track-panel.is-opening {
  pointer-events: none;
}

/* the name of a highlighted document, on its right, as the labels of the map before (black with a 3px white halo),
   in the font of the site */
:deep(.c2c-map-label) {
  width: max-content;
  white-space: pre;
  color: black;
  font-size: 12px;
  pointer-events: none;
  text-shadow:
    -1.5px -1.5px 0 white,
    0 -1.5px 0 white,
    1.5px -1.5px 0 white,
    1.5px 0 0 white,
    1.5px 1.5px 0 white,
    0 1.5px 0 white,
    -1.5px 1.5px 0 white,
    -1.5px 0 0 white;

  &.c2c-map-label-large {
    font-size: 17px;
  }
}

/* the document markers of the 3D view (map-3d-markers.ts): the icon and colours of the 2D ones, 20px icon, light
   translucent fill and grey ring, on a pin whose tip is the place (the marker is anchored at its bottom): in a tilted
   view a disc does not show which spot it marks. Bigger with the name on hover. Created by MapLibre outside the
   template: :deep */
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

  /* as the 2D label: 12px, black with a 3px white halo, no background, starting 20px right of the marker centre,
     wrapped around 30 characters */
  .map-3d-marker-label {
    display: none;
    position: absolute;
    top: calc((100% - 6px) / 2);
    left: calc(50% + 20px);
    width: max-content;
    max-width: 30ch;
    transform: translateY(-50%);
    color: black;
    font-size: 12px;
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
