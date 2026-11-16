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

    <div
      v-show="showRecenterOn"
      ref="recenterOnControl"
      class="ol-control ol-control-recenter-on ol-control-recenter-on_on-top"
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
      class="ol-control ol-control-recenter-on-propositions ol-control-recenter-on-propositions_on-top"
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

    <div ref="resetGeometryControl" class="ol-control ol-control-reset-geometry">
      <button @click="resetGeometry" v-translate>Reset geometry</button>
    </div>

    <div ref="clearGeometryControl" class="ol-control ol-control-clear-geometry">
      <button @click="clearGeometry" v-translate>Clear</button>
    </div>

    <div v-show="osmLayer" ref="editMapControl" class="ol-control ol-control-edit-map">
      <a :href="editMapLink ?? undefined" :title="$gettext('Edit and improve map on Openstreetmap.org')"
        ><fa-icon icon="pen"
      /></a>
    </div>
  </div>
</template>

<script setup lang="ts">
// The map of the edition of a document, on OpenLayers: draw its point or its line, move their points, or drop a GPS
// file on it. The other maps are on MapLibre (C2cMap.vue).
import type Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import type OlMap from 'ol/Map';
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
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue';

import LayerButton from './LayerButton.vue';
import { cartoLayers, dataLayers as dataLayersOf } from './map-layers-ol';
import {
  geoJSONFormat,
  getDocumentLineStyle,
  getDocumentPointStyle,
  getDocumentPolygonStyle,
  getElevationProfileMarkerStyle,
  isFiniteExtent,
} from './map-utils';

import photon from '@/js/apis/photon';
import { useGlobalProperties } from '@/js/composables/global-properties';
import bus from '@/js/event-bus';
import { FIT } from '@/js/fit/FIT';
import ol from '@/js/libs/ol';
import { TCX } from '@/js/tcx/TCX';
import { toast } from '@/js/toast';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const DEFAULT_EXTENT = [-400000, 5200000, 1200000, 6000000];
const DEFAULT_POINT_ZOOM = 14;
const MAX_ZOOM = 19;
const TRACKING_INITIAL_ZOOM = 13;

// a place found by Photon, to recenter the map on
type PhotonFeature = {
  geometry: { coordinates: number[] };
  properties: Record<string, string | undefined> & { extent?: number[] };
};

const isNotVirtual = (waypoint: C2cDocument) => waypoint.waypoint_type !== 'virtual';

const props = defineProps({
  // the documents shown around the edited one
  documents: {
    type: Array as PropType<C2cDocument[]>,
    default: null,
  },
  editedDocument: {
    type: Object,
    required: true,
  },
  geomDetailEditable: {
    type: Boolean,
    default: false,
  },
  initialExtent: {
    type: Array,
    default: null,
  },
  showRecenterOn: {
    type: Boolean,
    default: false,
  },
  showCenterOnGeolocation: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['move']);

const { $dateUtils, $documentUtils, $gettext, $language } = useGlobalProperties();

// OpenLayers objects must not be wrapped in Vue 3 reactive proxies, or OpenLayers
// does not render them. Their visibility is tracked through layersRevision instead.

// map layers, only one of them is visible
const mapLayers = markRaw(cartoLayers().map(markRaw));
// slope layers
const dataLayers = markRaw(dataLayersOf().map(markRaw));
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
const geolocation = shallowRef<InstanceType<typeof ol.Geolocation> | null>(null);
const showLayerSwitcher = ref(false);
const recenterPropositions = ref<{ data?: { features: PhotonFeature[] } | null } | null>(null);
const showRecenterOnPropositions = ref(false);
// there is a reset button: the initial geometry is kept
const initialGeometry = ref<C2cDocument['geometry']>(null);
const minZoomLevel = ref(DEFAULT_POINT_ZOOM);
const editMapLink = ref<string | null>(null);

// the OpenLayers map and its interactions: created on mount, not state to observe
let map: OlMap;
let drawInteraction: InstanceType<typeof ol.interaction.Draw> | null = null;
let onElevationProfile: ((event: unknown) => void) | undefined;

const rootElementEl = useTemplateRef<HTMLElement>('rootElement');
const mapElementEl = useTemplateRef<HTMLElement>('mapElement');
const layerSwitcherButtonEl = useTemplateRef<HTMLElement>('layerSwitcherButton');
const layerSwitcherEl = useTemplateRef<HTMLElement>('layerSwitcher');
const centerOnGeolocationControlEl = useTemplateRef<HTMLElement>('centerOnGeolocationControl');
const recenterOnControlEl = useTemplateRef<HTMLElement>('recenterOnControl');
const recenterOnPropositionsInputEl = useTemplateRef<HTMLInputElement>('recenterOnPropositionsInput');
const recenterOnPropositionsControlEl = useTemplateRef<HTMLElement>('recenterOnPropositionsControl');
const resetGeometryControlEl = useTemplateRef<HTMLElement>('resetGeometryControl');
const clearGeometryControlEl = useTemplateRef<HTMLElement>('clearGeometryControl');
const editMapControlEl = useTemplateRef<HTMLElement>('editMapControl');

const view = () => map.getView();

const visibleLayer = computed({
  get: () => mapLayers.find((layer) => isLayerVisible(layer))!,
  set(layer) {
    visibleLayer.value.setVisible(false);
    layer.setVisible(true);
  },
});

const osmLayer = computed(() => visibleLayer.value.get('title') === 'OpenTopoMap');

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
    setDocumentGeometryFromGeoFileFeatures(event.features as Feature[]);
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
      setDocumentGeometryFromGeoFileFeatures(features as Feature[]);
      return;
    }
  }
  toast({
    message: $gettext('No data could be extracted from GPS file'),
    type: 'is-danger',
  });
}

function setDocumentGeometryFromGeoFileFeatures(features: Feature[]) {
  // the GPS elevations of an outing are kept as they are (was window.document.type, always undefined)
  if (props.editedDocument!.type !== 'o') {
    features.forEach(cleanZeroElevationFromGeoFileFeature);
  }

  // a GPS file can hold several lines: a GPX gives one feature per track (its segments in a MultiLineString), a KML
  // one per placemark. Each feature used to replace the track of the previous one: they are merged in one track
  const isLine = (feature: Feature) =>
    feature.getGeometry() instanceof ol.geom.LineString || feature.getGeometry() instanceof MultiLineString;
  const lineFeatures = features.filter(isLine);

  features.filter((feature) => !isLine(feature)).forEach(setDocumentGeometryFromFeature);
  // a single line is kept as it is. The segments of a single track go through the same checks as several tracks: empty
  // segments skipped, put in the order of their times
  if (lineFeatures.length === 1 && !(lineFeatures[0].getGeometry() instanceof MultiLineString)) {
    setDocumentGeometryFromFeature(lineFeatures[0]);
  } else if (lineFeatures.length) {
    const geometries = lineFeatures.map((feature) => feature.getGeometry() as SimpleGeometry);
    const lines = geometries
      .flatMap((geometry) =>
        geometry instanceof MultiLineString
          ? geometry.getLineStrings()
          : [geometry as InstanceType<typeof ol.geom.LineString>]
      )
      // an empty segment (<trkseg/>) is kept as an empty line: it has no ends to close a ring, and its layout without
      // elevations would drop those of the other tracks
      .filter((line) => line.getCoordinates().length);
    if (!lines.length) {
      return;
    }
    // the tracks of a file are not always in the order they were recorded (files joined by hand): when they all have
    // times, they are put in order. Otherwise, they stay in the order of the file
    if (lines.every((line) => startTime(line) !== undefined)) {
      lines.sort((line1, line2) => startTime(line1)! - startTime(line2)!);
    }
    // the merged track drops the times when a track has none: the outing date is read from each track, the first
    // timed one gives it
    lines.forEach((line) => setOutingStartDate(props.editedDocument!, line));
    // an area is a polygon: as rings of one polygon, the other tracks would be holes, outside of it most of the time.
    // Each track is a polygon of its own instead
    setDocumentGeometryFromFeature(
      new ol.Feature(props.editedDocument!.type === 'a' ? linesToPolygons(lines) : mergeLines(lines))
    );
  }
}

/** The time of the first point of a line, when it has times */
function startTime(line: InstanceType<typeof ol.geom.LineString>) {
  const layout = line.getLayout();
  return layout.endsWith('M') ? line.getFirstCoordinate()[layout.length - 1] || undefined : undefined;
}

function linesToPolygons(lines: InstanceType<typeof ol.geom.LineString>[]) {
  const polygons = lines.map((line) => {
    const ring = line.getCoordinates().map((coord) => [coord[0], coord[1]]);
    const [first, last] = [ring[0], ring[ring.length - 1]];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      // close the loop
      ring.push([...first]);
    }
    return [ring];
  });
  // a single track stays a polygon
  return polygons.length === 1 ? new ol.geom.Polygon(polygons[0], 'XY') : new ol.geom.MultiPolygon(polygons, 'XY');
}

function mergeLines(lines: InstanceType<typeof ol.geom.LineString>[]) {
  // the tracks may not all have elevations or times: only the dimensions they all have are kept
  const hasZ = lines.every((line) => line.getLayout().includes('Z'));
  const hasM = lines.every((line) => line.getLayout().endsWith('M'));
  const layout = `XY${hasZ ? 'Z' : ''}${hasM ? 'M' : ''}` as 'XY' | 'XYZ' | 'XYM' | 'XYZM';
  const coordinates = lines.map((line) => {
    const lineLayout = line.getLayout();
    return line
      .getCoordinates()
      .map((coord) => [
        coord[0],
        coord[1],
        ...(hasZ ? [coord[2]] : []),
        ...(hasM ? [coord[lineLayout.indexOf('M')]] : []),
      ]);
  });
  return new MultiLineString(coordinates, layout);
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

function emitMoveEvent() {
  const bounds = view().calculateExtent();
  emit('move', bounds.map(Math.round));
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

function isLayerVisible(layer: BaseLayer) {
  // reading layersRevision makes callers re-evaluate when a layer visibility changes
  return layersRevision.value >= 0 && layer.getVisible();
}

function toogleMapLayer(layer: BaseLayer) {
  layer.setVisible(!layer.getVisible());
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

async function fitMapToDocuments(force?: boolean) {
  if (!force) {
    return view().calculateExtent().map(Math.round);
  }
  drawDocumentMarkers();
  let extent: Extent = ol.extent.createEmpty();
  for (const layer of [editionLayer, documentsLayer, waypointsLayer]) {
    ol.extent.extend(extent, layer.getSource()!.getExtent()!);
  }
  if (!isFiniteExtent(extent)) {
    extent = DEFAULT_EXTENT;
  }
  return fit(extent);
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

onMounted(() => {
  map = new ol.Map({
    target: mapElementEl.value!,
    controls: [
      new ol.control.FullScreen({
        source: rootElementEl.value!,
        tipLabel: $gettext('Toggle full-screen', 'Map Controls'),
      }),
      new ol.control.Zoom({
        zoomInTipLabel: $gettext('Zoom in', 'Map controls'),
        zoomOutTipLabel: $gettext('Zoom out', 'Map controls'),
      }),
      new ol.control.ScaleLine(),
      new ol.control.Control({ element: layerSwitcherButtonEl.value! }),
      new ol.control.Control({ element: layerSwitcherEl.value! }),
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
      imagesLayer, // images icons will be under documents
      documentsLayer,
      waypointsLayer, // keep waypoint above trace and documents
      elevationProfileLayer,
      editionLayer,
    ],
    view: new ol.View({ maxZoom: MAX_ZOOM }),
  });

  map.on('moveend', updateEditMapLink);
  map.on('moveend', emitMoveEvent);

  [...mapLayers, ...dataLayers].forEach((layer) => layer.on('change:visible', () => layersRevision.value++));

  geolocation.value = markRaw(
    new ol.Geolocation({ trackingOptions: { enableHighAccuracy: true }, projection: view().getProjection() })
  );
  geolocation.value.on('change:position', setCenterOnGeoLocation);

  drawDocumentMarkers();
  if (props.initialExtent) {
    fit(props.initialExtent as Extent);
  } else {
    fitMapToDocuments(true);
  }

  // deep clone of the geometry, to reset it
  initialGeometry.value = JSON.parse(JSON.stringify(props.editedDocument.geometry));
  setModifyInteractions();
  setDrawInteraction();
  setDragAndDropInteraction();

  // the point of the elevation profile under its cursor
  setElevationProfileInteraction();
  updateEditMapLink();
});

onBeforeUnmount(() => {
  // off() without a handler would remove the handlers of every map
  if (onElevationProfile) {
    bus.off('elevation_profile', onElevationProfile);
  }
});

// what the edition uses
defineExpose({ fitMapToDocuments, setDocumentGeometryFromGeoFile });
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
