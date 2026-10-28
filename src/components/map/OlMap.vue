<template>
  <div ref="rootElement" style="width: 100%; height: 100%">
    <div ref="mapElement" style="width: 100%; height: 100%" @click="showLayerSwitcher = false" />

    <div
      ref="layerSwitcherButton"
      class="ol-control ol-control-layer-switcher-button"
      :title="$gettext('Layers', 'Map controls')"
    >
      <button @click.stop="showLayerSwitcher = !showLayerSwitcher">
        <fa-icon icon="layer-group" />
      </button>
    </div>

    <div
      v-show="showPinToTopButton && !isFullscreen"
      ref="togglePinToTopButton"
      class="ol-control ol-control-pin-to-top"
      :title="$gettext('Pin the map to a side of the screen')"
    >
      <button @click.stop="$emit('pin-to-top-clicked')">
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
      <button @click="activateCenterOnGeolocation">
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

    <biodiv-information v-if="protectionAreasVisible" ref="biodivWindow" :data="biodivData" />

    <swiss-protection-area-information
      v-if="protectionAreasVisible"
      ref="swissWindow"
      :data="swissProtectionAreaData"
    />
  </div>
</template>

<script setup lang="ts">
import { toast } from 'bulma-toast';
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
  markRaw,
  type PropType,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';

import BiodivInformation from './BiodivInformation.vue';
import LayerButton from './LayerButton.vue';
import SwissProtectionAreaInformation from './SwissProtectionAreaInformation.vue';
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
import bus from '@/js/event-bus';
import { FIT } from '@/js/fit/FIT';
import ol from '@/js/libs/ol';
import { TCX } from '@/js/tcx/TCX';
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
// protection areas layer as features
const protectionAreasLayer = markRaw(new ol.layer.Vector({ source: new ol.source.Vector() }));
// protection areas layers
const protectionAreasLayers = markRaw(protectionAreasLayersOf().map(markRaw));
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
const hasProtectionAreas = ref<boolean | null>(null);
// on editable mode, there a button reset
// we must save initial geometry
const initialGeometry = ref<C2cDocument['geometry']>(null);
const highlightedFeature = shallowRef<FeatureLike | null>(null);
const minZoomLevel = ref(DEFAULT_POINT_ZOOM);
const editMapLink = ref<string | null>(null);

// the OpenLayers map and its controls: created on mount, not state to observe
let map: OlMap;
let drawInteraction: InstanceType<typeof ol.interaction.Draw> | null = null;
let fullScreenControl: InstanceType<typeof ol.control.FullScreen>;
let onElevationProfile: ((event: unknown) => void) | undefined;

const rootElementEl = useTemplateRef<HTMLElement>('rootElement');
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
const biodivWindowEl = useTemplateRef<{ show(): void }>('biodivWindow');
const swissWindowEl = useTemplateRef<{ show(): void }>('swissWindow');

const editable = computed(() => !!props.editedDocument);

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
    if (document.geometry.geom) {
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
      addFeature(
        source,
        JSON.parse(document.geometry.geom_detail),
        style ?? getDocumentLineStyle(title, false, document.properties),
        style ? null : getDocumentLineStyle(title, true, document.properties)
      )!.set('document', document);
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

function addBiodivSportsData(response: { data?: { results?: BiodivResult[] } } | undefined) {
  const results = response?.data?.results;
  if (!results?.length) {
    return;
  }

  const source = protectionAreasLayer.getSource()!;

  for (const result of results) {
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

    source.addFeature(feature);
  }
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

function onPointerMove(event: MapBrowserEvent<PointerEvent>) {
  let resultFeature: FeatureLike | null = null;

  map.forEachFeatureAtPixel(event.pixel, (feature) => {
    resultFeature = feature;
    return true;
  });
  setHighlightedFeature(resultFeature);
  emit('highlight-document', resultFeature ? (resultFeature as FeatureLike).get('document') : null);
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
}

function intersectsWithSwitzerland(extent: Extent) {
  return ol.extent.intersects(extent, swissExtent);
}

function onClick(event: MapBrowserEvent<PointerEvent>) {
  const feature = map.forEachFeatureAtPixel(event.pixel, (f) => f);

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

function getProtectionAreas() {
  if (!protectionAreasVisible.value) {
    return;
  }

  const extent = view().calculateExtent(map.getSize());
  // get extent in expected format
  const bsExtent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857')!, ol.proj.get('EPSG:4326')!);

  if (hasProtectionAreas.value !== null) {
    // check already made, only update biodivsport areas features
    biodivSportsService
      .fetchData(bsExtent as TupleExtent, props.biodivSportsActivities as string[] | undefined, $language.current!)
      .then((response) => addBiodivSportsData(response as Parameters<typeof addBiodivSportsData>[0]));
  } else {
    // first call, check protection areas are contained within map extent and download biodivsports features
    Promise.allSettled([
      biodivSportsService
        .fetchData(bsExtent as TupleExtent, props.biodivSportsActivities as string[] | undefined, $language.current!)
        .then((response) => {
          const biodivResponse = response as Parameters<typeof addBiodivSportsData>[0];
          addBiodivSportsData(biodivResponse);
          return (biodivResponse?.data?.results?.length ?? 0) > 0;
        }),
      intersectsWithSwitzerland(extent)
        ? respecterCestProtegerService.hasArea(extent as TupleExtent)
        : Promise.resolve(false),
    ]).then((hasArea) => {
      hasProtectionAreas.value = hasArea.some((result) => (result.status === 'fulfilled' ? result.value : false));
      if (hasProtectionAreas.value) {
        emit('has-protection-area');
      }
    });
  }
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
      new ol.control.Attribution({ tipLabel: $gettext('Attributions', 'Map controls') }),
    ],

    layers: [
      ...mapLayers,
      ...dataLayers,
      ...protectionAreasLayers,
      protectionAreasLayer,
      imagesLayer, // images icons will be under documents
      documentsLayer,
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
  map.on('moveend', getProtectionAreas);
  map.on('moveend', updateEditMapLink);
  map.on('moveend', emitMoveEvent);

  [...mapLayers, ...dataLayers].forEach((layer) => layer.on('change:visible', () => layersRevision.value++));

  if (protectionAreasVisible.value) {
    protectionAreasLayers.forEach((layer) => layer.setVisible(true));
  }

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
    map.on('click', (event) => onClick(event as MapBrowserEvent<PointerEvent>));
  }

  // listen to elevation profile events to display
  // the related point on the map
  setElevationProfileInteraction();

  updateEditMapLink();
});

onBeforeUnmount(() => {
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

<style lang="scss">
// disable mobile CSS for controls.
.ol-touch .ol-control button {
  font-size: 1.14em !important;
}
</style>

<style lang="scss">
@import 'ol/ol.css';

:root,
:host {
  --ol-background-color: rgba(0, 60, 136, 0.6);
  --ol-accent-background-color: #f5f5f5;
  --ol-subtle-background-color: rgba(128, 128, 128, 0.25);
  --ol-partial-background-color: rgba(255, 255, 255, 0.75);
  --ol-foreground-color: #fff;
  --ol-subtle-foreground-color: #fff;
  --ol-brand-color: #00aaff;
}
</style>

<style lang="scss" scoped>
$control-margin: 0.5em;

.ol-control-pin-to-top {
  top: 80px;
  left: $control-margin;
}

.ol-control-center-on-geolocation {
  top: 120px;
  left: $control-margin;
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

// a button: beat the .ol-control button rules of ol.css
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
  bottom: $control-margin;
  left: $control-margin;
}

.ol-control-use-map-as-filter {
  top: $control-margin;
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
  top: $control-margin;
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
  bottom: 35px;
  right: $control-margin;

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

<style lang="scss">
$control-margin: 0.5em;

.ol-attribution ul,
.ol-scale-line {
  --ol-subtle-foreground-color: #666666;
  --ol-foreground-color: #333333;
}

.ol-attribution ul {
  display: flex;
  flex-direction: column;
}

.ol-scale-line {
  bottom: calc($control-margin + 1px);
  right: 40px;
  left: initial;
  line-height: 1.3;
}

.ol-full-screen {
  right: auto;
  left: $control-margin;
  top: 60px;
}
</style>
