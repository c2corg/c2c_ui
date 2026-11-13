<template>
  <div ref="rootElement" style="position: relative; width: 100%; height: 100%">
    <div ref="mapElement" style="width: 100%; height: 100%" @click="showLayerSwitcher = false" />

    <div
      ref="layerSwitcherButton"
      class="ol-control ol-control-layer-switcher-button"
      :title="$gettext('Layers', 'Map controls')"
    >
      <!-- the title of the control, also the name of its button for screen readers -->
      <button :aria-label="$gettext('Layers', 'Map controls')" @click.stop="showLayerSwitcher = !showLayerSwitcher">
        <fa-icon icon="layer-group" />
      </button>
    </div>

    <!-- 3D view -->
    <div v-show="show3d && can3d" ref="map3dButton" class="ol-control ol-control-3d" title="3D">
      <button aria-label="3D" @click.stop="open3d"><span>3D</span></button>
    </div>

    <map-3d-view
      v-if="map3d"
      :bounds="map3d.bounds"
      :country="map3d.country"
      :documents="map3d.documents"
      :markers="map3d.markers"
      :protection-areas="map3d.protectionAreas"
      :full-screen-element-id="fullScreenElementId"
      @close="map3d = null"
      @unavailable="on3dUnavailable"
    />

    <div
      v-show="showPinToTopButton && !isFullscreen"
      ref="togglePinToTopButton"
      class="ol-control ol-control-pin-to-top"
      :title="$gettext('Pin the map to a side of the screen')"
    >
      <button :aria-label="$gettext('Pin the map to a side of the screen')" @click.stop="$emit('pin-to-top-clicked')">
        <fa-icon icon="fa-regular fa-window-maximize" />
      </button>
    </div>

    <div v-show="showLayerSwitcher" ref="layerSwitcher" class="ol-control ol-control-layer-switcher" @click.stop="">
      <div class="ol-control-layer-switcher-layers">
        <header v-translate>Base layer</header>
        <div class="layer-group">
          <layer-button
            v-for="layer of mapLayers"
            :key="layer.get('title')"
            @click="visibleLayer = layer"
            :selected="layer === visibleLayer"
            :layer="layer"
            title-context="Map layer"
          ></layer-button>
        </div>
        <header v-translate>Slopes</header>
        <div class="layer-group">
          <layer-button
            v-for="layer of dataLayers"
            :key="layer.get('title')"
            @click="toogleMapLayer(layer)"
            :selected="isLayerVisible(layer)"
            :layer="layer"
            title-context="Map slopes layer"
          ></layer-button>
        </div>
        <template v-if="showProtectionAreas && !editable">
          <header v-translate>Protection areas</header>
          <!-- $gettext('Fauna protection areas') -->
          <div class="layer-group">
            <layer-button
              @click="toggleProtectionAreas"
              :selected="protectionAreasVisible"
              :layer="protectionAreasLayerButton"
            ></layer-button>
          </div>
        </template>
        <template v-if="showDensityOverlays && !densityUnavailable">
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
      </div>
      <button
        type="button"
        class="ol-control-layer-switcher-close"
        :title="$gettext('Close')"
        :aria-label="$gettext('Close')"
        @click.stop="showLayerSwitcher = !showLayerSwitcher"
      >
        <fa-icon icon="chevron-left" />
      </button>
    </div>

    <div
      v-show="showCenterOnGeolocation"
      ref="centerOnGeolocationControl"
      :title="$gettext('Recenter on your current position')"
      class="ol-control ol-control-center-on-geolocation"
    >
      <button :aria-label="$gettext('Recenter on your current position')" @click="activateCenterOnGeolocation">
        <fa-icon icon="bullseye" />
      </button>
    </div>

    <div v-show="showFilterControl" ref="useMapAsFilter" class="ol-control ol-control-use-map-as-filter">
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
      v-show="showRecenterOn"
      ref="recenterOnControl"
      class="ol-control ol-control-recenter-on"
      :class="{ 'ol-control-recenter-on_on-top': !showFilterControl }"
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
      ref="recenterOnPropositionsControl"
      class="ol-control ol-control-recenter-on-propositions"
      :class="{ 'ol-control-recenter-on-propositions_on-top': !showFilterControl }"
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

    <div v-show="editable" ref="resetGeometryControl" class="ol-control ol-control-reset-geometry">
      <button @click="resetGeometry" v-translate>Reset geometry</button>
    </div>

    <div v-show="editable" ref="clearGeometryControl" class="ol-control ol-control-clear-geometry">
      <button @click="clearGeometry" v-translate>Clear</button>
    </div>

    <div v-show="osmLayer" ref="editMapControl" class="ol-control ol-control-edit-map">
      <a :href="editMapLink ?? undefined" :title="$gettext('Edit and improve map on Openstreetmap.org')"
        ><fa-icon icon="pen"
      /></a>
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
      <ul>
        <li
          v-for="entry of trackPanelEntries"
          :key="`${entry.document.type}-${entry.document.document_id}`"
          @mouseenter="setHighlightedFeature(entry.feature)"
          @mouseleave="setHighlightedFeature(null)"
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
import type { FeatureCollection, Geometry } from 'geojson';
import type Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import type OlMap from 'ol/Map';
import type MapBrowserEvent from 'ol/MapBrowserEvent';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type FeatureFormat from 'ol/format/Feature';
import type { ReadOptions } from 'ol/format/Feature';
import MultiLineString from 'ol/geom/MultiLineString';
import type SimpleGeometry from 'ol/geom/SimpleGeometry';
import type BaseLayer from 'ol/layer/Base';
import type VectorSource from 'ol/source/Vector';
import type Style from 'ol/style/Style';
import type { StyleLike } from 'ol/style/Style';
import {
  computed,
  defineAsyncComponent,
  markRaw,
  type PropType,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';

import BiodivInformation from './BiodivInformation.vue';
import LayerButton from './LayerButton.vue';
import SwissProtectionAreaInformation from './SwissProtectionAreaInformation.vue';
import type { Marker3d } from './map-3d-markers';
import { markUnsupported, supports3d } from './map-3d-support';
import {
  DENSITY_FETCH_DEBOUNCE,
  DENSITY_OVERLAYS,
  DENSITY_TRACKS_MIN_ZOOM,
  snapExtent,
  DENSITY_TYPES,
  type DensityFilters,
  type DensityType,
  createDensityLayers,
  createHeatmapLayer,
  heatmapWeight,
  sortTracks,
  type DensityTrack,
} from './density-overlays';
import {
  cartoLayers,
  dataLayers as dataLayersOf,
  protectionAreasLayers as protectionAreasLayersOf,
} from './map-layers';
import {
  buildDiffStyle,
  buildPolygonStyle,
  geoJSONFormat,
  getDocumentLineStyle,
  getDocumentIcon,
  getDocumentPointStyle,
  getDocumentPolygonStyle,
  getElevationProfileMarkerStyle,
  isFiniteExtent,
  swissExtent,
} from './map-utils';

import biodivSportsService from '@/js/apis/biodivsports-service';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import photon from '@/js/apis/photon';
import respecterCestProtegerService from '@/js/apis/respectercestproteger-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import debounce from '@/js/debounce';
import bus from '@/js/event-bus';
import { FIT } from '@/js/fit/FIT';
import ol from '@/js/libs/ol';
import { TCX } from '@/js/tcx/TCX';
import { toast } from '@/js/toast';
import { tracksOverlayEnabled } from '@/js/tracks-overlay';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const DEFAULT_EXTENT = [-400000, 5200000, 1200000, 6000000];
const DEFAULT_POINT_ZOOM = 14;
const MAX_ZOOM = 19;
const TRACKING_INITIAL_ZOOM = 13;

// the extents of the BiodivSports and Swiss protection area services
type TupleExtent = [number, number, number, number];

// an area of BiodivSports
type BiodivResult = {
  id: number;
  name: string;
  description: string;
  info_url: string;
  kml_url: string;
  period: boolean[];
  geometry: object;
};

// a place found by Photon, to recenter the map on
type PhotonFeature = {
  geometry: { coordinates: number[] };
  properties: Record<string, string | undefined> & { extent?: number[] };
};

// MapLibre is loaded only when the 3D view opens
const Map3dView = defineAsyncComponent(() => import('./Map3dView.vue'));
// a type only: the markers module is loaded with the 3D view

const isNotVirtual = (waypoint: C2cDocument) => waypoint.waypoint_type !== 'virtual';

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
    type: Array,
    default: null,
  },

  geomDetailEditable: {
    type: Boolean,
    default: false,
  },

  editedDocument: {
    type: Object,
    default: null,
  },

  oldDocument: {
    type: Object,
    default: null,
  },

  newDocument: {
    type: Object,
    default: null,
  },

  highlightedDocument: {
    type: Object,
    default: null,
  },

  initialExtent: {
    type: Array,
    default: null,
  },

  fullScreenElementId: {
    type: String,
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
const { $dateUtils, $documentUtils, $gettext, $language, $user } = useGlobalProperties();

let cartoLayers_ = cartoLayers();
let dataLayers_ = dataLayersOf();

// swiss topo only for logged users
if (!$user.isLogged) {
  cartoLayers_ = cartoLayers_.filter((layer) => !layer.get('restricted'));
  dataLayers_ = dataLayers_.filter((layer) => !layer.get('restricted'));
}

// OpenLayers objects must not be wrapped in Vue 3 reactive proxies, or OpenLayers
// does not render them. Their visibility is tracked through layersRevision instead.

// map layers, only one of them is visible
const mapLayers = markRaw(cartoLayers_.map(markRaw));
// slope layers
const dataLayers = markRaw(dataLayers_.map(markRaw));
// extents of the biodiv-sports areas loaded, or being loaded
const protectionAreasExtents: Extent[] = [];
// protection areas layer as features
// OpenLayers loads the areas of the viewed extent and half a view around it: small moves and zooming in reuse them
// (OpenLayers alone would compare the extent around the view, and load again on any move)
const protectionAreasLayer = markRaw(
  new ol.layer.Vector({
    source: new ol.source.Vector({
      loader: loadProtectionAreas,
      strategy: (extent) =>
        protectionAreasExtents.some((loaded) => ol.extent.containsExtent(loaded, extent))
          ? []
          : [ol.extent.buffer(extent, ol.extent.getWidth(extent) / 2)],
    }),
  })
);
// protection areas layers
const protectionAreasLayers = markRaw(protectionAreasLayersOf().map(markRaw));
// the "Tracks" and "Routes" overlays
const densityLayers = Object.fromEntries(DENSITY_TYPES.map((type) => [type, createDensityLayers(type)])) as Record<
  DensityType,
  ReturnType<typeof createDensityLayers>
>;
// the heatmap layers of the overlays, created when first shown (see createHeatmapLayer)
const heatmapLayers: Partial<Record<DensityType, ReturnType<typeof createHeatmapLayer>>> = {};
// the hovered track of an overlay, drawn again over all the other tracks and over the lines of the documents
const trackHighlightLayer = markRaw(new ol.layer.Vector({ source: new ol.source.Vector() }));
// layer for document icons and paths
const documentsLayer = markRaw(new ol.layer.Vector({ source: new ol.source.Vector() }));
// layer edited document
const editionLayer = markRaw(new ol.layer.Vector({ source: new ol.source.Vector() }));
// layer for associated waypoints
const waypointsLayer = markRaw(new ol.layer.Vector({ source: new ol.source.Vector() }));
// layer for associated images
const imagesLayer = markRaw(new ol.layer.Vector({ source: new ol.source.Vector() }));
// layer for displaying the elevation profile current point
const elevationProfileLayer = markRaw(new ol.layer.Vector({ source: new ol.source.Vector() }));

// bumped on each layer visibility change, so that computed values and the layer switcher update
const layersRevision = ref(0);
const isFullscreen = ref(false);
const geolocation = shallowRef<InstanceType<typeof ol.Geolocation> | null>(null);
const showLayerSwitcher = ref(false);
const filterDocumentsWithMap = ref(Boolean(route.query.bbox));
const recenterPropositions = ref<{ data?: { features: PhotonFeature[] } | null } | null>(null);
const showRecenterOnPropositions = ref(false);
const biodivData = ref<Record<string, unknown>>({});
const swissProtectionAreaData = ref<Record<string, unknown>>({ properties: {} });
const protectionAreasVisible = ref<boolean>(props.showProtectionAreas && !props.editedDocument);
// the overlays are off by default: they are an opt-in addition, not a change to the look of the map
const densityEnabled = reactive<Record<DensityType, boolean>>({ outing: false, route: false });
// set when the API answers that the overlays are turned off: they are no longer offered
const densityUnavailable = ref(false);
// the tracks under a click or a tap, to choose from, with their line on the map
const trackPanelEntries = shallowRef<{ document: DensityTrack; feature: Feature }[]>([]);
// false just after a tap opened the panel: the click that follows it would land on the panel
const trackPanelReady = ref(true);
// the track under the pointer, and how many others are there
const trackTooltip = ref<{ document: DensityTrack; others: number } | null>(null);
// on editable mode, there a button reset
// we must save initial geometry
const initialGeometry = ref<C2cDocument['geometry']>(null);
const highlightedFeature = shallowRef<FeatureLike | null>(null);
const minZoomLevel = ref(DEFAULT_POINT_ZOOM);
const editMapLink = ref<string | null>(null);
// what the 3D view shows, null when closed
const map3d = shallowRef<{
  bounds: [number, number, number, number];
  country: string | undefined;
  documents: FeatureCollection;
  markers: Marker3d[];
  protectionAreas: { visible: boolean; features: FeatureCollection } | null;
} | null>(null);

// the OpenLayers map and its controls: created on mount, not state to observe
let map: OlMap;
let drawInteraction: InstanceType<typeof ol.interaction.Draw> | null = null;
let fullScreenControl: InstanceType<typeof ol.control.FullScreen>;
let onElevationProfile: ((event: unknown) => void) | undefined;

// the popup of the tracks under a click
let trackTooltipOverlay: InstanceType<typeof ol.Overlay> | null = null;
// only the answer to the latest request of an overlay is displayed: moving the map quickly can make them arrive out of
// order
const densityRequestIds: Record<DensityType, number> = { outing: 0, route: 0 };

const rootElementEl = useTemplateRef<HTMLElement>('rootElement');
const trackTooltipEl = useTemplateRef<HTMLElement>('trackTooltip');
const mapElementEl = useTemplateRef<HTMLElement>('mapElement');
const layerSwitcherButtonEl = useTemplateRef<HTMLElement>('layerSwitcherButton');
const togglePinToTopButtonEl = useTemplateRef<HTMLElement>('togglePinToTopButton');
const layerSwitcherEl = useTemplateRef<HTMLElement>('layerSwitcher');
const centerOnGeolocationControlEl = useTemplateRef<HTMLElement>('centerOnGeolocationControl');
const useMapAsFilterEl = useTemplateRef<HTMLElement>('useMapAsFilter');
const recenterOnControlEl = useTemplateRef<HTMLElement>('recenterOnControl');
const recenterOnPropositionsInputEl = useTemplateRef<HTMLInputElement>('recenterOnPropositionsInput');
const recenterOnPropositionsControlEl = useTemplateRef<HTMLElement>('recenterOnPropositionsControl');
const resetGeometryControlEl = useTemplateRef<HTMLElement>('resetGeometryControl');
const clearGeometryControlEl = useTemplateRef<HTMLElement>('clearGeometryControl');
const editMapControlEl = useTemplateRef<HTMLElement>('editMapControl');
const map3dButtonEl = useTemplateRef<HTMLElement>('map3dButton');
// the browser can show the 3D view (WebGL 2), checked only where the 3D button may show
const can3d = ref(false);
watch(
  () => props.show3d,
  (show3d) => {
    if (show3d) can3d.value = supports3d();
  },
  { immediate: true }
);

// the 3D view failed to start (WebGL refused): back to 2D, without the button
function on3dUnavailable() {
  markUnsupported();
  can3d.value = false;
  map3d.value = null;
}
const biodivWindowEl = useTemplateRef<{ show(): void }>('biodivWindow');
const swissWindowEl = useTemplateRef<{ show(): void }>('swissWindow');

const editable = computed(() => !!props.editedDocument);
// the overlays are on every map, except when editing a document or comparing two versions of it
const showDensityOverlays = computed(
  () => tracksOverlayEnabled && !editable.value && !props.oldDocument && !props.newDocument
);

const urlValue = computed(() => {
  const result = route.query.bbox as string | undefined;
  return result
    ? result
        .replace('%252C', ',')
        .split(',')
        .map((num) => parseInt(num, 10))
    : undefined;
});

const view = () => map.getView();

const visibleLayer = computed({
  get: () => mapLayers.find((layer) => isLayerVisible(layer))!,
  set(layer) {
    visibleLayer.value.setVisible(false);
    layer.setVisible(true);
  },
});

const osmLayer = computed(() => visibleLayer.value.get('title') === 'OpenTopoMap');

// c2c areas of the countries that have an orthophoto in 3D
const ORTHO_COUNTRY_AREAS: Record<number, string> = { 14274: 'fr', 14067: 'ch', 14267: 'es' };

function documentsCountry(): string | undefined {
  for (const document of props.documents ?? []) {
    for (const area of document.areas ?? []) {
      if (ORTHO_COUNTRY_AREAS[area.document_id]) return ORTHO_COUNTRY_AREAS[area.document_id];
    }
  }
  return undefined;
}

// opens the 3D view on the extent, base layer and documents of the 2D map
function open3d() {
  const extent = ol.proj.transformExtent(view().calculateExtent(map.getSize()), 'EPSG:3857', 'EPSG:4326');
  const toLonLat = (feature: Feature) =>
    ol.proj.toLonLat((feature.getGeometry() as InstanceType<typeof ol.geom.Point>).getCoordinates()) as [
      number,
      number,
    ];
  const marker = (feature: Feature, interactive: boolean): Marker3d | null => {
    const document = feature.get('document') as C2cDocument | undefined;
    const icon = document && getDocumentIcon(document);
    if (!document || !icon) return null;
    return {
      lonLat: toLonLat(feature),
      title: $documentUtils.getDocumentTitle(document),
      ...icon,
      to: interactive
        ? { name: $documentUtils.getDocumentType(document.type), params: { id: document.document_id } }
        : null,
    };
  };
  const isPoint = (feature: Feature) => feature.getGeometry()?.getType() === 'Point';
  const documentFeatures = documentsLayer.getSource()!.getFeatures();
  const lines = [...documentFeatures, ...editionLayer.getSource()!.getFeatures()].filter(
    (feature) => feature.getGeometry() && !isPoint(feature)
  );
  const waypointMarkers = waypointsLayer
    .getSource()!
    .getFeatures()
    .filter(isPoint)
    .map((feature) => marker(feature, true));
  // the point of the document itself: a waypoint always (among its child waypoints), another document only when there
  // is nothing else to show (no track, no waypoint)
  const documentPoints = documentFeatures.filter(isPoint);
  const ownPoints = documentPoints.filter(
    (feature) => (feature.get('document') as C2cDocument | undefined)?.type === 'w'
  );
  const markers = [
    ...documentPoints
      .filter((feature) => ownPoints.includes(feature) || !(lines.length || waypointMarkers.length))
      .map((feature) => marker(feature, false)),
    ...waypointMarkers,
  ].filter((m): m is Marker3d => !!m);
  const features = lines;
  map3d.value = {
    bounds: extent as [number, number, number, number],
    // the country of the 2D base layer, else the one of the documents
    country: visibleLayer.value.get('country') ?? documentsCountry(),
    documents: {
      type: 'FeatureCollection',
      features: features
        .filter((feature) => feature.getGeometry())
        .map((feature) => ({
          type: 'Feature',
          // paragliding tracks: their flights are drawn in the air
          properties: {
            paragliding: !!(feature.get('document') as C2cDocument | undefined)?.activities?.includes('paragliding'),
          },
          geometry: geoJSONFormat.writeGeometryObject(feature.getGeometry()!, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326',
          }) as Geometry,
        })),
    },
    markers,
    // the biodiv-sports areas the 2D map loaded: its view and half a view around, where the 3D view opens
    protectionAreas:
      props.showProtectionAreas && !editable.value
        ? {
            visible: protectionAreasVisible.value,
            features: geoJSONFormat.writeFeaturesObject(
              protectionAreasLayer
                .getSource()!
                .getFeatures()
                .map((feature) => new ol.Feature(feature.getGeometry())),
              { featureProjection: 'EPSG:3857', dataProjection: 'EPSG:4326' }
            ) as FeatureCollection,
          }
        : null,
  };
  addRouteWaypoints();
}

// an outing has no waypoint of its own: the 3D view also shows those of its routes (access, hut, summit), read when
// it opens (a request per route, 3 routes at most)
async function addRouteWaypoints() {
  const opened = map3d.value;
  const routeIds = [
    ...new Set(
      (props.documents ?? [])
        .filter((document) => document.type === 'o')
        .flatMap((outing) => outing.associations?.routes?.map((route) => route.document_id) ?? [])
        .filter((id): id is number => id !== undefined)
    ),
  ].slice(0, 3);
  if (!opened || !routeIds.length) return;
  const routes = await Promise.all(
    routeIds.map((id) =>
      Promise.resolve((c2c.route as DocumentService).get(id, $language.current!)).then(
        (response) => response.data as C2cDocument,
        () => null
      )
    )
  );
  if (map3d.value !== opened) return;
  const shown = new Set(opened.markers.map((marker) => (marker.to as { params?: { id?: number } } | null)?.params?.id));
  const markers: Marker3d[] = [];
  for (const waypoint of routes.flatMap((route) => route?.associations?.waypoints ?? []).filter(isNotVirtual)) {
    const icon = getDocumentIcon(waypoint);
    if (!icon || !waypoint.geometry?.geom || shown.has(waypoint.document_id)) continue;
    shown.add(waypoint.document_id);
    const point = geoJSONFormat.readGeometry(waypoint.geometry.geom) as InstanceType<typeof ol.geom.Point>;
    markers.push({
      lonLat: ol.proj.toLonLat(point.getCoordinates()) as [number, number],
      title: $documentUtils.getDocumentTitle(waypoint),
      ...icon,
      to: { name: 'waypoint', params: { id: waypoint.document_id } },
    });
  }
  if (markers.length) map3d.value = { ...opened, markers: [...opened.markers, ...markers] };
}

function createFullScreenController(source: HTMLElement | string) {
  const control = new ol.control.FullScreen({
    source,
    tipLabel: $gettext('Toggle full-screen', 'Map Controls'),
  });
  control.on('enterfullscreen', onFullscreenChange);
  control.on('leavefullscreen', onFullscreenChange);
  return control;
}

function onFullscreenChange() {
  isFullscreen.value = !isFullscreen.value;
  showLayerSwitcher.value = false;
  fitMapToDocuments();
}

function setModifyInteractions() {
  const source = editionLayer.getSource()!;
  const modify = new ol.interaction.Modify({ source });

  map.addInteraction(modify);
  map.addInteraction(new ol.interaction.Snap({ source }));

  modify.on('modifyend', (event) => {
    for (const feature of event.features.getArray()) {
      setDocumentGeometry(feature.get('geometry'));
    }
  });
}

function setDrawInteraction() {
  const source = editionLayer.getSource()!;

  if (drawInteraction) {
    map.removeInteraction(drawInteraction);
  }

  drawInteraction = null;

  const editedDocument = props.editedDocument!;
  // sometimes, geom may not be set on edited documents
  editedDocument.geometry = editedDocument.geometry ?? {};

  if (!editedDocument.geometry.geom) {
    // the point is not set
    if (editedDocument.type !== 'o') {
      // do not let user set the point for outings
      drawInteraction = new ol.interaction.Draw({
        source,
        type: 'Point',
      });
    }
  } else if (props.geomDetailEditable && !editedDocument.geometry.geom_detail) {
    drawInteraction = new ol.interaction.Draw({
      source,
      type: 'LineString',
    });
  }

  if (drawInteraction) {
    map.addInteraction(drawInteraction);

    drawInteraction.on('drawend', (event) => {
      setDocumentGeometryFromFeature(event.feature);
    });
  }
}

function setDragAndDropInteraction() {
  // handle use case when user drag&drop a gpx/kml/fit/tcx file on map
  const dragAndDrop = new ol.interaction.DragAndDrop({
    formatConstructors: [ol.format.GPX, ol.format.KML, FIT, TCX] as unknown as (typeof FeatureFormat)[],
  });

  dragAndDrop.on('addfeatures', (event) => {
    event.features!.map((feature) => {
      // the GPS elevations of an outing are kept as they are (was window.document.type, always undefined)
      if (props.editedDocument!.type !== 'o') {
        cleanZeroElevationFromGeoFileFeature(feature as Feature);
      }
      return setDocumentGeometryFromFeature(feature);
    });
  });

  map.addInteraction(dragAndDrop);
}

function tryReadFeaturesFromGeoFile(file: string | ArrayBuffer, format: FeatureFormat, options: ReadOptions) {
  try {
    return format.readFeatures(file, options);
  } catch {
    return null;
  }
}

function cleanZeroElevationFromGeoFileFeature(feature: Feature) {
  // GPS often have a bad elevation (0) for some of the points
  // We do a simple algorithm to prevent most of these cases
  // by applying the elevation of the nearest 'good' coordinate to the
  // 'faulty' coordinates if they are not too far away
  const geometry = feature.getGeometry();
  if (geometry instanceof ol.geom.LineString) {
    const coords = geometry.getCoordinates();
    cleanZeroElevationFromLineString(coords);
    geometry.setCoordinates(coords);
  } else if (geometry instanceof MultiLineString) {
    const coords = geometry.getCoordinates();
    coords.forEach(cleanZeroElevationFromLineString);
    geometry.setCoordinates(coords);
  }
}

function cleanZeroElevationFromLineString(coords: Coordinate[]) {
  const findIndex = (array: Coordinate[], callback: (coord: Coordinate) => boolean, start: number) => {
    const index = array.slice(start).findIndex(callback);
    return index === -1 ? -1 : index + start;
  };
  const findIndexBackwards = (array: Coordinate[], callback: (coord: Coordinate) => boolean, start: number) => {
    const index = findIndex(array.slice().reverse(), callback, array.length - 1 - start);
    return index > 0 ? array.length - 1 - index : index;
  };
  const isElevationOk = (coord: Coordinate) => coord.length > 2 && coord[2] !== 0;
  // Since we use EPSG:3857, we can easily compute the approximated distance
  const distance = (c: Coordinate[], i: number, j: number) =>
    Math.sqrt((c[i][0] - c[j][0]) ** 2 + (c[i][1] - c[j][1]) ** 2);

  if (!coords.some(isElevationOk)) {
    return;
  }

  let badIndex = 0;
  while ((badIndex = findIndex(coords, (coord) => !isElevationOk(coord), badIndex)) !== -1) {
    // Get the distance between the point without elevation, and the nearest point with elevation
    // If it's less than 100m, we can consider that it's elevation is the same
    const goodIndexFw = findIndex(coords, isElevationOk, badIndex);
    const goodIndexBw = findIndexBackwards(coords, isElevationOk, badIndex);
    const distanceFw = goodIndexFw !== -1 ? distance(coords, badIndex, goodIndexFw) : Infinity;
    const distanceBw = goodIndexBw !== -1 ? distance(coords, badIndex, goodIndexBw) : Infinity;

    if (distanceFw > 100 && distanceBw > 100) {
      badIndex++;
      break;
    }

    coords[badIndex][2] = coords[distanceFw < distanceBw ? goodIndexFw : goodIndexBw][2];
    badIndex++;
  }
}

function setDocumentGeometryFromGeoFile(file: string | ArrayBuffer) {
  for (const format of [new ol.format.GPX(), new ol.format.KML(), new ol.format.GeoJSON(), new FIT(), new TCX()]) {
    const features = tryReadFeaturesFromGeoFile(file, format, { featureProjection: 'EPSG:3857' });
    if (features?.length) {
      features.map((feature) => {
        // the GPS elevations of an outing are kept as they are (was window.document.type, always undefined)
        if (props.editedDocument!.type !== 'o') {
          cleanZeroElevationFromGeoFileFeature(feature);
        }
        return setDocumentGeometryFromFeature(feature);
      });
      return;
    }
  }
  toast({
    message: $gettext('No data could be extracted from GPS file'),
    type: 'is-danger',
  });
}

function setDocumentGeometryFromFeature(feature: FeatureLike) {
  const geometry = feature.getGeometry() as SimpleGeometry;
  setDocumentGeometry(geometry);
  drawDocumentMarkers();
  setDrawInteraction();
  setOutingStartDate(props.editedDocument!, geometry);
}

function setOutingStartDate(document: C2cDocument, geometry: SimpleGeometry) {
  if (document.type !== 'o' || document.date_start) {
    return;
  }

  const firstCoordinate = geometry.getFirstCoordinate()!;
  let timestamp;
  switch (geometry.getLayout()) {
    case 'XYZM':
      timestamp = firstCoordinate[3];
      break;
    case 'XYM':
      timestamp = firstCoordinate[2];
      break;
    default:
      return;
  }

  if (!timestamp) {
    return;
  }

  document.date_start = $dateUtils.toLocalizedString(new Date(timestamp * 1000), 'YYYY-MM-DD');
}

function setElevationProfileInteraction() {
  elevationProfileLayer.setVisible(false);
  const elevationProfileSource = elevationProfileLayer.getSource()!;
  const elevationProfileMarker = new ol.Feature();
  elevationProfileMarker.setStyle(getElevationProfileMarkerStyle());
  elevationProfileSource.addFeature(elevationProfileMarker);
  onElevationProfile = (event) => {
    const { action, coord } = event as { action: string; coord: Coordinate };
    switch (action) {
      case 'cursor_end':
        elevationProfileLayer.setVisible(false);
        break;
      case 'cursor_move':
        elevationProfileLayer.setVisible(true);
        elevationProfileMarker.setGeometry(new ol.geom.Point(coord));
        const visible = ol.extent.containsXY(view().calculateExtent(), coord[0], coord[1]);
        if (!visible) {
          view().animate({
            center: coord,
            duration: 300,
          });
        }
        break;
      case 'toggle_fullscreen':
        setTimeout(() => map.updateSize(), 0);
    }
  };
  bus.on('elevation_profile', onElevationProfile);
}

function setDocumentGeometry(geometry: SimpleGeometry) {
  const document = props.editedDocument!;
  // a GeoJSON geometry: its type and coordinates change below
  const geoJsonGeometry = geoJSONFormat.writeGeometryObject(geometry) as { type: string; coordinates: any };

  const change = (newGeometry: { geom?: string; geom_detail?: string }) => {
    if (newGeometry.geom) {
      document.geometry.geom = newGeometry.geom;
    }

    if (newGeometry.geom_detail) {
      document.geometry.geom_detail = newGeometry.geom_detail;
    }
  };

  if (geoJsonGeometry.type === 'Point') {
    // remove elevation and timestamp
    geoJsonGeometry.coordinates = geoJsonGeometry.coordinates.slice(0, 2);
    change({ geom: JSON.stringify(geoJsonGeometry) });
  } else if (geoJsonGeometry.type === 'LineString' || geoJsonGeometry.type === 'MultiLineString') {
    if (document.type === 'a') {
      // areas need a polygon, let's change the path, check that first and last points are the same
      geoJsonGeometry.type = 'Polygon';
      const firstPoint = JSON.stringify(geoJsonGeometry.coordinates[0][0]);
      const lastPoint = JSON.stringify(geoJsonGeometry.coordinates[0][geoJsonGeometry.coordinates[0].length - 1]);

      if (firstPoint !== lastPoint) {
        // close the loop
        geoJsonGeometry.coordinates[0].push(geoJsonGeometry.coordinates[0][0]);
      }
    }

    change({ geom_detail: JSON.stringify(geoJsonGeometry) });

    if (!document.geometry.geom) {
      const mainLine =
        geometry instanceof MultiLineString
          ? geometry.getLineString(0)
          : (geometry as InstanceType<typeof ol.geom.LineString>);
      setDocumentGeometry(new ol.geom.Point(mainLine!.getCoordinateAt(0.5)));
    }
  } else if (geoJsonGeometry.type === 'Polygon' || geoJsonGeometry.type === 'MultiPolygon') {
    // areas
    change({ geom_detail: JSON.stringify(geoJsonGeometry) });
  } else {
    throw new Error(`Unexpected geometry type : ${geometry.getType()}`);
  }
}

function drawDocumentMarkers() {
  const editionSource = editionLayer.getSource()!;
  const documentsSource = documentsLayer.getSource()!;
  const waypointsSource = waypointsLayer.getSource()!;
  const imagesSource = imagesLayer.getSource()!;

  editionSource.clear();
  documentsSource.clear();
  waypointsSource.clear();
  imagesSource.clear();

  addDocumentFeature(props.oldDocument, documentsSource, buildDiffStyle(true));
  addDocumentFeature(props.newDocument, documentsSource, buildDiffStyle(false));

  addDocumentFeature(props.editedDocument, editionSource);

  for (const document of props.documents ?? []) {
    addDocumentFeature(document, documentsSource);

    if (document.associations) {
      for (const waypoint of document.associations.waypoints?.filter(isNotVirtual) ?? []) {
        addDocumentFeature(waypoint, waypointsSource);
      }
      for (const waypoint of document.associations.waypoint_children?.filter(isNotVirtual) ?? []) {
        addDocumentFeature(waypoint, waypointsSource);
      }

      // show associated images only for outings
      if (document.type === 'o') {
        for (const image of document.associations.images ?? []) {
          if (!$documentUtils.hasSameGeolocation(image, document)) {
            // show image marker only if it's geolocation is different from document
            addDocumentFeature(image, imagesSource);
          }
        }
      }
    }
  }
}

function addDocumentFeature(document: C2cDocument | null, source: VectorSource, style?: Style) {
  if (!document?.geometry) {
    return;
  }

  const title = $documentUtils.getDocumentTitle(document);

  // special case for documents of type areas, we want a filled polygon.
  if (document.type === 'a') {
    if (document.geometry.geom_detail) {
      addFeature(
        source,
        JSON.parse(document.geometry.geom_detail),
        style ?? getDocumentPolygonStyle(title, false, document.properties),
        style ? null : getDocumentPolygonStyle(title, true, document.properties)
      )!.set('document', document);
    }
  } else {
    // outside edition and diffs, the point marker of a document with a line adds nothing to the line:
    // the line alone is shown, and carries the id used to highlight the document from the lists
    const lineOnly = !!document.geometry.geom_detail && !style && source !== editionLayer.getSource();

    if (document.geometry.geom && !lineOnly) {
      const feature = addFeature(
        source,
        JSON.parse(document.geometry.geom),
        style ?? getDocumentPointStyle(document, title, false),
        style ? null : getDocumentPointStyle(document, title, true)
      );

      feature!.set('document', document);
      feature!.setId(document.document_id);
    }
    if (document.geometry.geom_detail) {
      const feature = addFeature(
        source,
        JSON.parse(document.geometry.geom_detail),
        style ?? getDocumentLineStyle(title, false, document.properties),
        style ? null : getDocumentLineStyle(title, true, document.properties)
      );

      feature!.set('document', document);
      if (lineOnly) {
        feature!.setId(document.document_id);
      }
    }
  }
}

function addFeature(source: VectorSource, data: object, normalStyle: StyleLike, highlightedStyle: StyleLike | null) {
  if (!data) {
    return;
  }

  const feature = geoJSONFormat.readFeature(data) as Feature;

  feature.set('normalStyle', normalStyle);

  if (highlightedStyle) {
    feature.set('highlightedStyle', highlightedStyle);
  }

  feature.setStyle(normalStyle);
  source.addFeature(feature);

  return feature;
}

function biodivSportsFeatures(response: { data?: { results?: BiodivResult[] } } | undefined) {
  const features: Feature[] = [];

  for (const result of response?.data?.results ?? []) {
    const geometry = geoJSONFormat.readGeometry(result.geometry, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });

    const feature = new ol.Feature({
      geometry: geometry ?? undefined,
      id: result.id,
      biodivData: {
        source: 'biodivsports',
        title: result.name,
        description: result.description,
        infoUrl: result.info_url,
        kmlUrl: result.kml_url,
        period: result.period,
      },
    });

    feature.setId('biodiv_' + result.id);

    feature.set('normalStyle', buildPolygonStyle());
    feature.setStyle(feature.get('normalStyle'));

    features.push(feature);
  }

  return features;
}

function toggleProtectionAreas() {
  protectionAreasVisible.value = !protectionAreasVisible.value;
  protectionAreasLayers.forEach((layer) => layer.setVisible(!layer.getVisible()));
  protectionAreasLayer.setVisible(!protectionAreasLayer.getVisible());
}

function protectionAreasLayerSet(name: string, value: number) {
  if (name === 'opacity') {
    protectionAreasLayers.forEach((layer) => layer.setOpacity(value));
    protectionAreasLayer.getSource()!.forEachFeature((feature) => {
      feature.set('normalStyle', buildPolygonStyle(value));
      feature.setStyle(feature.get('normalStyle'));
    });
  }
}

function protectionAreasLayerGet(name: string) {
  switch (name) {
    case 'opacity':
      return protectionAreasLayers[0].getOpacity();
    case 'configurable':
      return true;
  }
}

// the button of the protection areas, with the opacity of their layers
const protectionAreasLayerButton = {
  title: 'Fauna protection areas',
  image: 'fauna.jpg',
  set: protectionAreasLayerSet,
  get: protectionAreasLayerGet,
};

function emitMoveEvent() {
  const bounds = view().calculateExtent();
  emit('move', bounds.map(Math.round));
}

// If user want's to filter with map, it will send extent to url
// otherwise, it set bbox url to undefined
function sendBoundsToUrl() {
  const bounds = view().calculateExtent();
  const query: LocationQueryRaw = Object.assign({}, route.query);

  query.bbox = filterDocumentsWithMap.value ? bounds.map(Math.round).join(',') : undefined;
  if (query.bbox !== route.query.bbox && !String(route.name).endsWith('-print')) {
    router.push({ query });
  }
}

function fit(extent: Extent) {
  view().fit(extent, { size: map.getSize() });

  // slightly increase the extent, for more comfort
  let zoom = view().getZoom()! * 0.95;

  // and set a minimum zoom level
  zoom = Math.min(minZoomLevel.value, zoom);

  view().setZoom(zoom);

  return view().calculateExtent().map(Math.round);
}

async function fitMapToDocuments(force?: boolean) {
  if ((filterDocumentsWithMap.value || editable.value) && !force) {
    return view().calculateExtent().map(Math.round);
  }

  drawDocumentMarkers();

  let extent: Extent = ol.extent.createEmpty();

  for (const layer of [editionLayer, documentsLayer, waypointsLayer]) {
    ol.extent.extend(extent, layer.getSource()!.getExtent()!);
  }

  if (!isFiniteExtent(extent)) {
    const a = route.query.a;
    // compute extent for area(s)
    if (a) {
      const areas = await Promise.all(
        (Array.isArray(a) ? a.map((area) => String(area)) : a.toString().split(',')).map(
          async (area) => await (c2c.area as DocumentService).get(Number(area))
        )
      );
      extent = areas
        .flatMap((response) => {
          const geometry = geoJSONFormat.readGeometry(JSON.parse(response.data.geometry!.geom_detail!));
          if (geometry instanceof ol.geom.Polygon) {
            return [geometry];
          } else if (geometry instanceof ol.geom.MultiPolygon) {
            return geometry.getPolygons();
          }
          return [];
        })
        .flatMap((polygon) => polygon.getCoordinates())
        .map((coords) => ol.extent.boundingExtent(coords))
        .reduce((acc, ext) => ol.extent.extend(acc, ext));
    }

    // add extent for waypoint
    const w = route.query.w;
    if (w) {
      const waypoints = await Promise.all(
        (Array.isArray(w) ? w.map((wpt) => String(wpt)) : w.toString().split(',')).map(
          async (wpt) => await (c2c.waypoint as DocumentService).get(Number(wpt))
        )
      );
      extent = waypoints
        .map((response) => response.data.geometry?.geom)
        .filter((geom) => !!geom)
        .map((geom) => geoJSONFormat.readFeatures(geom!)[0])
        .map((point) => ol.extent.buffer(point.getGeometry()!.getExtent(), 10000))
        .reduce((acc, ext) => ol.extent.extend(acc, ext), isFiniteExtent(extent) ? extent : ol.extent.createEmpty());
    }

    if (!isFiniteExtent(extent)) {
      // if there is infinity, default extent
      // TODO need to be current extent if it exists ...
      extent = DEFAULT_EXTENT;
    }
  }

  return fit(extent);
}

function isLayerVisible(layer: BaseLayer) {
  // reading layersRevision makes callers re-evaluate when a layer visibility changes
  return layersRevision.value >= 0 && layer.getVisible();
}

function toogleMapLayer(layer: BaseLayer) {
  layer.setVisible(!layer.getVisible());
}

function getExtent(projection?: string) {
  let extent = view().calculateExtent(map.getSize());
  if (projection) {
    extent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857')!, ol.proj.get(projection)!);
  }
  return extent;
}

// the layers whose features are highlighted on hover
const hoverableLayers = new Set<object>([documentsLayer, waypointsLayer, imagesLayer]);

function onPointerMove(event: MapBrowserEvent<PointerEvent>) {
  // no hit detection while panning: it runs on every pointer move
  if (event.dragging) {
    return;
  }

  // no hover on a touch screen: the tooltip would stay under the finger
  if (isTouch(event)) {
    hideTrackTooltip();
    return;
  }

  const hits = hitsAt(event.pixel, HIT_TOLERANCE, true);
  // the topmost feature of the documents: the markers come before the tracks
  const tracksLayers: object[] = Object.values(densityLayers).map((layers) => layers.tracks);
  const documentHit = hits.find((hit) => !tracksLayers.includes(hit.layer));
  const tracks = documentHit && isMarker(documentHit.feature) ? [] : trackEntries(tracksIn(hits));
  const hovered = tracks[0]?.feature ?? documentHit?.feature ?? null;

  // the pages react to each event (the nearby stops reset all their styles): only tell them about changes
  if (hovered !== highlightedFeature.value) {
    setHighlightedFeature(hovered);
    emit('highlight-document', hovered ? hovered.get('document') : null);
  }

  // not over the panel of the tracks, which tells it all
  if (tracks.length && !trackPanelEntries.value.length) {
    trackTooltip.value = { document: tracks[0].document, others: tracks.length - 1 };
    trackTooltipOverlay!.setPosition(event.coordinate);
  } else {
    hideTrackTooltip();
  }
}

// a pointer that is not a mouse: a finger
const isTouch = (event: { originalEvent?: Event }) =>
  (event.originalEvent as PointerEvent | undefined)?.pointerType === 'touch';

// how far from a line or an icon a pointer still hits it, in pixels: the tracks are thin, a finger is not
const HIT_TOLERANCE = 6;
const TOUCH_HIT_TOLERANCE = 14;

// What is under a pixel, the topmost first, in one hit detection. To hover: the layers of the documents (markers, lines,
// images) and the tracks of the overlays. To click: all that is drawn (the protection areas too), but not the heatmaps
// (no document), nor the copy of the hovered track.
function hitsAt(pixel: number[], hitTolerance: number, hover = false) {
  const heatmaps = Object.values(heatmapLayers);
  const tracksLayers: object[] = Object.values(densityLayers).map((layers) => layers.tracks);
  const hits: { feature: Feature; layer: object }[] = [];
  map.forEachFeatureAtPixel(
    pixel,
    (feature, layer) => void hits.push({ feature: feature as Feature, layer: layer as object }),
    {
      layerFilter: (layer) =>
        hover
          ? hoverableLayers.has(layer) || tracksLayers.includes(layer)
          : layer !== trackHighlightLayer && !heatmaps.includes(layer as never),
      hitTolerance,
    }
  );
  return hits;
}

// the tracks of the overlays among the hits, except the document the map is about
function tracksIn(hits: { feature: Feature; layer: object }[]): Feature[] {
  if (!showDensityOverlays.value) {
    return [];
  }

  const tracksLayers: unknown[] = Object.values(densityLayers).map((layers) => layers.tracks);
  const displayed = props.documents?.length === 1 ? props.documents[0] : null;
  return hits
    .filter((hit) => tracksLayers.includes(hit.layer))
    .map((hit) => hit.feature)
    .filter((track) => {
      const document = track.get('document');
      return !(displayed && document.type === displayed.type && document.document_id === displayed.document_id);
    });
}

// the tracks with their document, the most recent outings first
function trackEntries(features: Feature[]) {
  const byDocument = new Map<DensityTrack, Feature>(features.map((feature) => [feature.get('document'), feature]));
  return sortTracks([...byDocument.keys()]).map((document) => ({ document, feature: byDocument.get(document)! }));
}

// what a track is on the map, for the list: its color on its casing
function trackSwatchStyle(document: DensityTrack) {
  const { trackColor, casingColor } = DENSITY_OVERLAYS[document.type === 'o' ? 'outing' : 'route'];
  return { background: trackColor, borderColor: casingColor };
}

function isMarker(feature: FeatureLike) {
  return (feature as Feature).getGeometry()?.getType() === 'Point';
}

function hideTrackTooltip() {
  trackTooltip.value = null;
  trackTooltipOverlay?.setPosition(undefined);
}

function setHighlightedFeature(feature: FeatureLike | null) {
  if (feature === highlightedFeature.value) {
    return;
  }

  if (highlightedFeature.value) {
    (highlightedFeature.value as Feature).setStyle(highlightedFeature.value.get('normalStyle'));
  }

  // as is: a proxy would never equal the feature hovered, and OpenLayers objects must stay out of reactivity
  highlightedFeature.value = feature && markRaw(feature);

  if (feature && feature.get('highlightedStyle')) {
    (feature as Feature).setStyle(feature.get('highlightedStyle'));
  }

  // a track of an overlay is drawn again on top, thicker: the tracks of the overlays are in two layers, under the
  // lines of the documents
  const highlightSource = trackHighlightLayer.getSource()!;
  highlightSource.clear();
  const trackStyle = feature?.get('trackHighlightedStyle');
  if (trackStyle) {
    const copy = new ol.Feature((feature as Feature).getGeometry());
    copy.setStyle(trackStyle);
    highlightSource.addFeature(copy);
  }
}

function intersectsWithSwitzerland(extent: Extent) {
  return ol.extent.intersects(extent, swissExtent);
}

function toggleDensityOverlay(type: DensityType) {
  densityEnabled[type] = !densityEnabled[type];

  if (densityEnabled[type]) {
    updateDensityOverlay(type);
  } else {
    cancelDensityRequest(type);
    heatmapLayers[type]?.setVisible(false);
    densityLayers[type].tracks.setVisible(false);
    closeTrackPanel();
  }
}

// the heatmap layer of an overlay, added to the map under the tracks layer when first needed
function heatmapLayer(type: DensityType) {
  let layer = heatmapLayers[type];
  if (!layer) {
    layer = heatmapLayers[type] = createHeatmapLayer(type);
    const layers = map.getLayers();
    layers.insertAt(layers.getArray().indexOf(densityLayers[type].tracks), layer);
  }
  return layer;
}

function updateDensityOverlays() {
  DENSITY_TYPES.forEach(updateDensityOverlay);
}

// the request of each overlay that is running, cancelled when the map moves on
const densityRequests: Partial<Record<DensityType, AbortController>> = {};
// what each overlay shows now (its request), to not ask again for the same thing
const shownDensity: Partial<Record<DensityType, string>> = {};

function cancelDensityRequest(type: DensityType) {
  delete shownDensity[type];
  densityRequests[type]?.abort();
  delete densityRequests[type];
}

async function updateDensityOverlay(type: DensityType) {
  if (!densityEnabled[type]) {
    return;
  }

  const layers = densityLayers[type];
  const overlay = DENSITY_OVERLAYS[type];
  const zoom = Math.round(view().getZoom()!);
  const filters = (type === 'outing' ? props.tracksFilters : props.routesFilters) ?? {};
  // a box on a grid, so that small moves of the map ask for the same thing: the answer is already there (and the
  // browser keeps it, the API lets it)
  const params = { ...filters, bbox: snapExtent(getExtent()).join(',') };
  const key = JSON.stringify([params, $language.current, zoom >= DENSITY_TRACKS_MIN_ZOOM]);
  if (key === shownDensity[type]) {
    return;
  }
  const requestId = ++densityRequestIds[type];
  const isCurrent = () => requestId === densityRequestIds[type] && densityEnabled[type];

  cancelDensityRequest(type);
  const { signal } = (densityRequests[type] = new AbortController());

  try {
    if (zoom >= DENSITY_TRACKS_MIN_ZOOM) {
      const { data } = await overlay.getTracks({ ...params, pl: $language.current }, signal);
      if (!isCurrent()) {
        return;
      }

      if (!data.truncated) {
        heatmapLayers[type]?.setVisible(false);
        layers.tracks.setVisible(true);

        const source = layers.tracks.getSource()!;
        source.clear();
        closeTrackPanel();
        for (const document of data.documents) {
          const feature = addFeature(source, JSON.parse(document.geometry.geom_detail), layers.trackStyle, null);
          feature?.set('document', document);
          feature?.set('trackHighlightedStyle', layers.trackHighlightedStyle);
        }
        shownDensity[type] = key;
        return;
      }
      // too many tracks to draw them: their density, as when zoomed out
    }

    // the size of the cells comes from the box, on the server
    const { data } = await overlay.getHeatmap(params, signal);
    if (!isCurrent()) {
      return;
    }

    layers.tracks.setVisible(false);
    const heatmap = heatmapLayer(type);
    heatmap.setVisible(true);
    closeTrackPanel();

    const source = heatmap.getSource()!;
    source.clear();

    const maxCount = Math.max(1, ...data.buckets.map((bucket) => bucket.count));
    for (const bucket of data.buckets) {
      const feature = new ol.Feature(new ol.geom.Point([bucket.x, bucket.y]));
      feature.set('weight', heatmapWeight(bucket.count, maxCount));
      source.addFeature(feature);
    }
    shownDensity[type] = key;
  } catch (error) {
    // a request replaced by a newer one, or given up: nothing to tell
    if (signal.aborted) {
      return;
    }
    // the API turns the overlays off when they load the servers too much (TRACKS_OVERLAY_ENABLED): so does the map
    if ((error as { response?: { status?: number } } | null)?.response?.status === 503) {
      densityUnavailable.value = true;
      turnOffDensityOverlays();
    }
    // any other error: the overlays are non-critical, leave the map usable
  }
}

function turnOffDensityOverlays() {
  const wereOn = DENSITY_TYPES.some((type) => densityEnabled[type]);

  for (const type of DENSITY_TYPES) {
    densityEnabled[type] = false;
    cancelDensityRequest(type);
    heatmapLayers[type]?.setVisible(false);
    densityLayers[type].tracks.setVisible(false);
  }
  closeTrackPanel();

  if (wereOn) {
    toast({ message: $gettext('The Outings and Routes overlays are temporarily unavailable'), type: 'is-warning' });
  }
}

let trackPanelTimeout: ReturnType<typeof setTimeout> | undefined;

function openTrackPanel(features: Feature[], touch: boolean) {
  trackPanelEntries.value = trackEntries(features);
  hideTrackTooltip();

  // a touch screen sends a click after the tap, where the panel now is: it must not open the first track
  clearTimeout(trackPanelTimeout);
  trackPanelReady.value = !touch;
  if (!trackPanelReady.value) {
    trackPanelTimeout = setTimeout(() => (trackPanelReady.value = true), 500);
  }
}

function closeTrackPanel() {
  trackPanelEntries.value = [];
  setHighlightedFeature(null);
}

function onClick(event: MapBrowserEvent<PointerEvent>) {
  const touch = isTouch(event);
  const hits = hitsAt(event.pixel, touch ? TOUCH_HIT_TOLERANCE : HIT_TOLERANCE);
  const documentHit = hits.find((hit) => hoverableLayers.has(hit.layer));
  const tracks = documentHit && isMarker(documentHit.feature) ? [] : tracksIn(hits);

  // several tracks under the click, or one under a finger: choose one, or see what it is
  if (tracks.length > 1 || (tracks.length === 1 && touch)) {
    openTrackPanel(tracks, touch);
    return;
  }
  closeTrackPanel();

  // a track is thin: clicking next to it counts
  const feature = tracks[0] ?? hits[0]?.feature;

  if (feature) {
    const document = feature.get('document');

    if (
      document &&
      document.properties &&
      document.properties.nonInteractive &&
      document.type === 'w' &&
      document.waypoint_type === 'access'
    ) {
      emit('waypoint-clicked', document);
      return;
    }

    if (document && document.properties && document.properties.nonInteractive) {
      return;
    }

    if (document && document.type === 'z') {
      emit('waypoint-clicked', document);
      return;
    }
    if (document && document.type === 's') {
      emit('stop-clicked', document.document_id);
      return;
    }
    if (document) {
      if (props.documents?.length === 1 && document.document_id === props.documents[0].document_id) {
        return;
      }
      if (event.originalEvent.ctrlKey || props.openInNewTab) {
        const href = router.resolve({
          name: $documentUtils.getDocumentType(document.type),
          params: { id: document.document_id },
        }).href;
        window.open(location.origin + href, '_blank');
      } else {
        router.push({
          name: $documentUtils.getDocumentType(document.type),
          params: { id: document.document_id },
        });
      }
    } else if (feature.get('biodivData')) {
      biodivData.value = feature.get('biodivData');
      biodivWindowEl.value!.show();
    }
  } else {
    // handle clicks on enabled layers
    if (protectionAreasVisible.value) {
      const extent = view().calculateExtent(map.getSize());
      if (!intersectsWithSwitzerland(extent)) {
        return;
      }
      respecterCestProtegerService
        .identify(
          event.coordinate as [number, number],
          extent as TupleExtent,
          map.getSize()![0],
          map.getSize()![1],
          $language.current!
        )
        .then(({ data }) => {
          if (data.results && data.results.length) {
            // if there are several results, then there must be an area and an allowed path. select area
            swissProtectionAreaData.value =
              data.results.find((result: { geometry: { type: string } }) => result.geometry.type === 'MultiPolygon') ??
              data.results[0];
            swissWindowEl.value!.show();
          }
        });
    }
  }
}

function activateCenterOnGeolocation() {
  geolocation.value!.setTracking(true);
}

function setCenterOnGeoLocation() {
  const position = geolocation.value!.getPosition();
  view().setZoom(TRACKING_INITIAL_ZOOM);
  view().setCenter(position);
  geolocation.value!.setTracking(false);
}

function searchRecenterOnPropositions(event: Event) {
  const query = (event.target as HTMLInputElement).value;

  if (query?.length >= 3) {
    const center = view().getCenter();
    const centerWgs84 = ol.proj.toLonLat(center!) as [number, number];

    recenterPropositions.value = photon.getPropositions(query, $language.current!, centerWgs84);
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
  const feature = geoJSONFormat.readFeature(item) as Feature<InstanceType<typeof ol.geom.Point>>;
  let extent = feature.get('extent');
  let coordinates = feature.getGeometry()!.getCoordinates();

  if (extent) {
    // convert from W N E S to W S E N if needed
    extent = [extent[0], Math.min(extent[1], extent[3]), extent[2], Math.max(extent[1], extent[3])];
    extent = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
    view().fit(extent, { size: map.getSize(), maxZoom: 14 });
  } else {
    coordinates = ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857');
    view().setCenter(coordinates);
    view().setZoom(16);
  }

  showRecenterOnPropositions.value = false;
}

// the page is told once about protection areas in the view: by the Swiss check of the first view, or by the first
// biodiv-sports load that answers (after a failed load, the view of the next one is checked)
let protectionAreasNotified = false;
let swissProtectionAreasChecked = false;
let biodivSportsAreasChecked = false;

function notifyProtectionAreas() {
  if (!protectionAreasNotified) {
    protectionAreasNotified = true;
    emit('has-protection-area');
  }
}

// loader of the biodiv-sports areas layer: OpenLayers adds the features
function loadProtectionAreas(extent: Extent) {
  const source = protectionAreasLayer.getSource()!;
  protectionAreasExtents.push(extent);
  // get extent in expected format
  const bsExtent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857')!, ol.proj.get('EPSG:4326')!);

  const features = biodivSportsService
    .fetchData(bsExtent as TupleExtent, props.biodivSportsActivities as string[] | undefined, $language.current!)
    .then((response) => biodivSportsFeatures(response as Parameters<typeof biodivSportsFeatures>[0]))
    .catch((error) => {
      // OpenLayers keeps a failed extent as loaded: load it again on the next move (not right away, OpenLayers
      // renders again after a failure, which would load it again in a loop)
      map.once('moveend', () => {
        source.removeLoadedExtent(extent);
        protectionAreasExtents.splice(protectionAreasExtents.indexOf(extent), 1);
      });
      throw error;
    });

  const viewExtent = view().calculateExtent(map.getSize());

  if (!swissProtectionAreasChecked) {
    swissProtectionAreasChecked = true;
    if (intersectsWithSwitzerland(viewExtent)) {
      respecterCestProtegerService.hasArea(viewExtent as TupleExtent).then(
        (hasArea) => hasArea && notifyProtectionAreas(),
        () => {}
      );
    }
  }

  if (!biodivSportsAreasChecked) {
    features.then(
      (loaded) => {
        biodivSportsAreasChecked = true;
        if (loaded.some((feature) => feature.getGeometry()?.intersectsExtent(viewExtent))) {
          notifyProtectionAreas();
        }
      },
      () => {}
    );
  }

  return features;
}

function clearGeometry() {
  if (props.editedDocument.type !== 'o') {
    // user can't set the outing point directly (he must select the route)
    // So do not clear geometry.geom
    props.editedDocument.geometry.geom = null;
  }

  props.editedDocument.geometry.geom_detail = null;
  drawDocumentMarkers(); // redraw markers
  setDrawInteraction(); // reset interaction mode
}

function resetGeometry() {
  if (props.editedDocument.type === 'o') {
    // user can't set the outing point directly (he must select the route)
    // So do not reinit geometry.geom to nothing
    props.editedDocument.geometry.geom = initialGeometry.value?.geom || props.editedDocument.geometry.geom;
    props.editedDocument.geometry.geom_detail = initialGeometry.value?.geom_detail;
  } else {
    props.editedDocument.geometry = JSON.parse(JSON.stringify(initialGeometry.value));
  }

  drawDocumentMarkers(); // redraw markers
  setDrawInteraction(); // reset interaction mode
}

function updateEditMapLink() {
  const coords = ol.proj.transform(map.getView().getCenter()!, ol.proj.get('EPSG:3857')!, ol.proj.get('EPSG:4326')!);
  editMapLink.value = `https://www.openstreetmap.org/#map=13/${coords[1]}/${coords[0]}`;
}

/** Set the style for the highlighted points (hover) */
function highlightStop(stopId: number) {
  resetStopStyles();
  const stopFeature = findStopPoint(stopId);

  if (!stopFeature) {
    console.warn(`Stop with ID ${stopId} not found.`);
    return;
  }

  const title = stopFeature.get('document').stoparea_name;
  (stopFeature as Feature).setStyle(getDocumentPointStyle(stopFeature.get('document'), title, true));
}

/** Zoom and move the map to a point */
function goAndZoomOnStop(stopId: number) {
  const stopFeature = findStopPoint(stopId);

  if (!stopFeature) {
    console.warn(`Stop with ID ${stopId} not found.`);
    return;
  }
  const geometry = stopFeature.getGeometry() as InstanceType<typeof ol.geom.Point> | undefined;
  if (geometry) {
    const coordinate = geometry.getCoordinates();

    const view = map.getView();
    view.cancelAnimations();

    view.animate({
      center: coordinate,
      zoom: Math.max(view.getZoom()!, 14),
      duration: 300,
    });
  }
}

/** Center and zoom in/out the map depending on all elements on the map (points, multilines, etc.) */
function recenterOnDocuments() {
  if (!map || !props.documents || props.documents.length === 0) {
    console.warn('Cannot recenter - map or documents not available');
    return;
  }

  const extent = [Infinity, Infinity, -Infinity, -Infinity];

  props.documents.forEach((doc: C2cDocument) => {
    try {
      if (doc.geometry?.geom_detail) {
        const geom = JSON.parse(doc.geometry.geom_detail);

        if (geom.type === 'LineString' && geom.coordinates?.length > 0) {
          geom.coordinates.forEach((coord: number[]) => {
            const [x, y] =
              Math.abs(coord[0]) <= 180 && Math.abs(coord[1]) <= 90
                ? ol.proj.transform([coord[0], coord[1]], 'EPSG:4326', 'EPSG:3857')
                : [coord[0], coord[1]];

            extent[0] = Math.min(extent[0], x);
            extent[1] = Math.min(extent[1], y);
            extent[2] = Math.max(extent[2], x);
            extent[3] = Math.max(extent[3], y);
          });
        }
      }
    } catch (e) {
      console.error('Error processing document geometry:', e);
    }
  });

  if (extent[0] !== Infinity && extent[2] !== -Infinity) {
    const padding = 50;
    const mapSize = map.getSize()!;
    const ratio = padding / Math.min(mapSize[0], mapSize[1]);

    const width = extent[2] - extent[0];
    const height = extent[3] - extent[1];

    const paddedExtent = [
      extent[0] - width * ratio,
      extent[1] - height * ratio,
      extent[2] + width * ratio,
      extent[3] + height * ratio,
    ];

    map.getView().fit(paddedExtent, {
      duration: 1000,
      maxZoom: 18,
    });
  } else {
    map.getView().fit(DEFAULT_EXTENT);
    console.warn('No valid geometries found - using default extent');
  }
}

/** Set map elements to their normal graphic style (unhighlight) */
function resetStopStyles() {
  const documentsSource = documentsLayer.getSource()!;
  const waypointsSource = waypointsLayer.getSource()!;

  documentsSource.forEachFeature((feature) => {
    const type = feature.get('document').type;
    if (type !== 'w' && type !== 'z') {
      feature.setStyle(feature.get('normalStyle'));
    }
  });

  waypointsSource.forEachFeature((feature) => {
    feature.setStyle(feature.get('normalStyle'));
  });
}

/** Find the object of the stop based on its Id */
function findStopPoint(stopId: number) {
  const documentsSource = documentsLayer.getSource()!;
  const documentFeature = documentsSource.getFeatureById(stopId);

  if (documentFeature) {
    return documentFeature;
  }

  const waypointsSource = waypointsLayer.getSource()!;
  const waypointFeature = waypointsSource.getFeatureById(stopId);

  if (waypointFeature) {
    return waypointFeature;
  }

  console.warn(`Stop with ID ${stopId} not found.`);
  return null;
}

// the filters are compared by content: the parent may give a new (but identical) object each time the route changes
watch(
  () => JSON.stringify(props.tracksFilters),
  () => updateDensityOverlay('outing')
);
watch(
  () => JSON.stringify(props.routesFilters),
  () => updateDensityOverlay('route')
);

// deep 1: also when documents are added to or removed from the array, as Vue 2 array watchers did
watch(
  () => props.documents,
  () => drawDocumentMarkers(),
  { deep: 1 }
);
watch([() => props.editedDocument?.condition_rating, () => props.editedDocument?.waypoint_type], () =>
  drawDocumentMarkers()
);

// if, for any reason, geometry of edited document is set, center map on it
// * new value entered in text inputs
// * first click
// * new association to route (geometry is copied from route to outing in this case)
watch(
  () => props.editedDocument?.geometry?.geom,
  (to, from) => {
    if (from === null && to !== null) {
      setDrawInteraction(); // reset interaction mode
    }
  }
);

watch(filterDocumentsWithMap, () => sendBoundsToUrl());

watch(
  () => props.highlightedDocument,
  (newValue) => {
    const current = highlightedFeature.value?.get('document');
    // compared by type and id: the page gives a reactive proxy
    if (newValue && current && current.type === newValue.type && current.document_id === newValue.document_id) {
      return;
    }
    if (newValue) {
      setHighlightedFeature(documentsLayer.getSource()!.getFeatureById(newValue.document_id));
    } else {
      setHighlightedFeature(null);
    }
  }
);

watch(
  () => props.fullScreenElementId,
  (newValue) => {
    // changed before the map is mounted (the elevation profile of a draft has data once created): onMounted() uses it
    if (!map) {
      return;
    }

    // update the fullscreen control (we actually need to remove the old
    // one and attach a new one)
    map.removeControl(fullScreenControl);
    fullScreenControl = createFullScreenController(newValue || rootElementEl.value!);
    map.addControl(fullScreenControl);
  }
);

onMounted(() => {
  // if we have an elevation profile, it will be displayed over the map
  // else, we directly use the map element for fullscreen
  fullScreenControl = createFullScreenController(props.fullScreenElementId || rootElementEl.value!);

  map = new ol.Map({
    target: mapElementEl.value!,

    controls: [
      fullScreenControl,
      new ol.control.Zoom({
        zoomInTipLabel: $gettext('Zoom in', 'Map controls'),
        zoomOutTipLabel: $gettext('Zoom out', 'Map controls'),
      }),
      new ol.control.ScaleLine(),
      new ol.control.Control({ element: togglePinToTopButtonEl.value! }),
      new ol.control.Control({ element: layerSwitcherButtonEl.value! }),
      new ol.control.Control({ element: layerSwitcherEl.value! }),
      new ol.control.Control({ element: useMapAsFilterEl.value! }),
      new ol.control.Control({ element: centerOnGeolocationControlEl.value! }),
      new ol.control.Control({ element: recenterOnControlEl.value! }),
      new ol.control.Control({ element: recenterOnPropositionsControlEl.value! }),
      new ol.control.Control({ element: resetGeometryControlEl.value! }),
      new ol.control.Control({ element: clearGeometryControlEl.value! }),
      new ol.control.Control({ element: editMapControlEl.value! }),
      new ol.control.Control({ element: map3dButtonEl.value! }),
      new ol.control.Attribution({ tipLabel: $gettext('Attributions', 'Map controls') }),
    ],

    layers: [
      ...mapLayers,
      ...dataLayers,
      ...protectionAreasLayers,
      protectionAreasLayer,
      ...Object.values(densityLayers).map((layers) => layers.tracks),
      imagesLayer, // images icons will be under documents
      documentsLayer,
      trackHighlightLayer, // over the lines, under the markers
      waypointsLayer, // keep waypoint above trace and documents
      elevationProfileLayer,
      editionLayer,
    ],

    view: new ol.View({
      maxZoom: MAX_ZOOM,
    }),

    // pixelRatio: this.pixelRatio,
    // renderer: this.renderer,
    // keyboardEventTarget: this.keyboardEventTarget,
  });

  map.on('moveend', sendBoundsToUrl);
  map.on('moveend', updateEditMapLink);
  map.on('moveend', emitMoveEvent);

  if (showDensityOverlays.value) {
    // it must not catch the pointer, or hovering the track would hide it
    trackTooltipOverlay = new ol.Overlay({
      element: trackTooltipEl.value!,
      positioning: 'bottom-center',
      offset: [0, -12],
      stopEvent: false,
    });
    map.addOverlay(trackTooltipOverlay);
    map.getViewport()?.addEventListener('mouseout', hideTrackTooltip);

    map.on('moveend', debounce(updateDensityOverlays, DENSITY_FETCH_DEBOUNCE));
  }

  [...mapLayers, ...dataLayers].forEach((layer) => layer.on('change:visible', () => layersRevision.value++));

  if (protectionAreasVisible.value) {
    protectionAreasLayers.forEach((layer) => layer.setVisible(true));
  }
  // hidden, it loads nothing
  protectionAreasLayer.setVisible(protectionAreasVisible.value);

  geolocation.value = markRaw(
    new ol.Geolocation({
      trackingOptions: {
        enableHighAccuracy: true,
      },

      projection: view().getProjection(),
    })
  );

  geolocation.value.on('change:position', setCenterOnGeoLocation);

  drawDocumentMarkers();

  if (urlValue.value) {
    view().fit(urlValue.value, { size: map.getSize() });
  } else if (props.initialExtent) {
    fit(props.initialExtent as Extent);
  } else {
    fitMapToDocuments(true);
  }

  if (editable.value) {
    // deep clone : https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript
    initialGeometry.value = JSON.parse(JSON.stringify(props.editedDocument.geometry));

    setModifyInteractions();
    setDrawInteraction();
    setDragAndDropInteraction();
  } else {
    // if map is not editable, feature are clickable
    map.on('pointermove', (event) => onPointerMove(event as MapBrowserEvent<PointerEvent>));
    // with a finger, the second tap of a double tap zooms: wait for it (it would open the panel, and close it)
    map.on('click', (event) => !isTouch(event) && onClick(event as MapBrowserEvent<PointerEvent>));
    map.on('singleclick', (event) => isTouch(event) && onClick(event as MapBrowserEvent<PointerEvent>));
  }

  // listen to elevation profile events to display
  // the related point on the map
  setElevationProfileInteraction();

  updateEditMapLink();
});

onBeforeUnmount(() => {
  DENSITY_TYPES.forEach(cancelDensityRequest);
  // off() without a handler would remove the handlers of every map
  if (onElevationProfile) {
    bus.off('elevation_profile', onElevationProfile);
  }
  fullScreenControl.un('enterfullscreen', onFullscreenChange);
  fullScreenControl.un('leavefullscreen', onFullscreenChange);
});

// what the pages use: the OpenLayers map, its extent, and the moves of the map
defineExpose({
  get map() {
    return map;
  },
  fitMapToDocuments,
  getExtent,
  setDocumentGeometryFromGeoFile,
  highlightStop,
  goAndZoomOnStop,
  recenterOnDocuments,
  resetStopStyles,
});
</script>

<style>
/* disable mobile CSS for controls. */
.ol-touch .ol-control button,
.ol-touch .ol-control a {
  font-size: 1.14em !important;
}
</style>

<style>
@import 'ol/ol.css';

:root,
:host {
  --ol-background-color: rgba(0, 60, 136, 0.6);
  --ol-accent-background-color: var(--c2c-white-ter);
  --ol-subtle-background-color: rgba(128, 128, 128, 0.25);
  --ol-partial-background-color: rgba(255, 255, 255, 0.75);
  --ol-foreground-color: var(--c2c-white);
  --ol-subtle-foreground-color: var(--c2c-white);
  --ol-brand-color: #00aaff;
}
</style>

<style scoped>
/* the controls are 0.5em from the edges of the map */

.ol-control-pin-to-top {
  top: calc(1.5em + 3 * var(--map-button-size));
  left: 0.5em;
}

.ol-control-center-on-geolocation {
  top: calc(2em + 4 * var(--map-button-size));
  left: 0.5em;
}

.ol-control-layer-switcher {
  z-index: 1;
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

/* a button: beat the .ol-control button rules of ol.css */
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

.ol-control-reset-geometry {
  top: 5px;
  right: 5px;

  button {
    padding: 5px;
    width: auto !important;
    font-weight: normal;
  }
}

.ol-control-clear-geometry {
  top: 35px;
  right: 5px;

  button {
    padding: 5px;
    width: auto !important;
    font-weight: normal;
  }
}

.ol-control-edit-map {
  bottom: calc(1em + var(--map-button-size));
  right: 0.5em;

  svg {
    height: 0.7em;
    vertical-align: -0.45em;
  }
}

/* make the link look like a button, copy style from ol.css */
.ol-control a {
  display: block;
  margin: 1px;
  padding: 0;
  color: var(--ol-subtle-foreground-color);
  font-weight: bold;
  text-decoration: none;
  font-size: inherit;
  text-align: center;
  height: 1.375em;
  width: 1.375em;
  line-height: 0.4em;
  background-color: var(--ol-background-color);
  border: none;
  border-radius: 2px;
}

.ol-control a:hover,
.ol-control a:focus {
  text-decoration: none;
  outline: 1px solid var(--ol-subtle-foreground-color);
  color: var(--ol-foreground-color);
}
</style>

<style>
/* the controls are 0.5em from the edges of the map */

/*
 * outer size of an OpenLayers button: 1.375em plus 1px margin on each side,
 * buttons are 1.14 times bigger on touch devices (see above),
 * stacked controls are positioned in em with it so they never overlap,
 * even when the browser scales the text up (Android font size setting)
 */
.ol-viewport {
  --map-button-size: calc(1.375em + 2px);
}

.ol-viewport.ol-touch {
  --map-button-size: calc(1.14 * 1.375em + 2px);
}

.ol-attribution ul,
.ol-scale-line {
  --ol-subtle-foreground-color: #666666;
  --ol-foreground-color: var(--c2c-grey-darker);
}

.ol-attribution ul {
  display: flex;
  flex-direction: column;
}

/* the › of the open attribution in the middle of its button (OpenLayers draws it high) */
.ol-attribution button {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.ol-scale-line {
  bottom: calc(0.5em + 1px);
  right: calc(1em + var(--map-button-size));
  left: initial;
  line-height: 1.3;
}

.ol-full-screen {
  right: auto;
  left: 0.5em;
  top: calc(1em + 2 * var(--map-button-size));
}
</style>
