<template>
  <div ref="drawInfoElement">
    <p><fa-icon icon="route" transform="shrink-3" /> {{ Number(drawInfo.distance).toLocaleString() }}&nbsp;m</p>
    <p><fa-icon icon="compass" transform="shrink-3" /> {{ drawInfo.bearing }}°</p>
  </div>
</template>

<script setup lang="ts">
import { icon } from '@fortawesome/fontawesome-svg-core';
import type { Handler } from 'mitt';
import type Feature from 'ol/Feature';
import type { Coordinate } from 'ol/coordinate';
import type Geometry from 'ol/geom/Geometry';
import type LineString from 'ol/geom/LineString';
import MultiLineString from 'ol/geom/MultiLineString';
import type Point from 'ol/geom/Point';
import type Draw from 'ol/interaction/Draw';
import type Modify from 'ol/interaction/Modify';
import type Snap from 'ol/interaction/Snap';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type { VectorSourceEvent } from 'ol/source/Vector';
import type CircleStyle from 'ol/style/Circle';
import { getUid } from 'ol/util';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useLayer } from './layer';
import { getSortedFeatures } from './route-features';
import simplify from './simplify';
import SplitInteraction, { type SplitEvent } from './split-interaction';

import Yetix from '@/components/yeti/Yetix.vue';
import yetixEvents from '@/components/yeti/yetix-events';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import ol from '@/js/libs/ol';

type Line = Feature<LineString>;

const angle = 60;
const pColor = `hsl(${angle}, 100%, 50%)`;
const pColorLight = `hsl(${angle}, 100%, 90%)`;
const pColorDark = `hsl(${angle}, 100%, 20%)`;
const pWidth = 5;

let normalLineStyle = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: pColorDark,
      width: pWidth + 2,
    }),
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: pColor,
      width: pWidth,
    }),
  }),
];

let normalWithEditLineStyle = [
  ...normalLineStyle,
  new ol.style.Style({
    image: new ol.style.Circle({
      radius: pWidth - 1,
      fill: new ol.style.Fill({
        color: pColorLight,
      }),
      stroke: new ol.style.Stroke({
        color: pColorDark,
        width: 2,
      }),
    }),
    geometry(feature) {
      const coords = (feature.getGeometry() as LineString).getCoordinates().map((c) => new ol.geom.Point(c));
      return new ol.geom.GeometryCollection(coords);
    },
  }),
];

let editStyle = [
  new ol.style.Style({
    image: new ol.style.Circle({
      radius: 6,
      fill: new ol.style.Fill({
        color: pColorDark,
      }),
      stroke: new ol.style.Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'white',
      width: pWidth + 1,
    }),
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: pColorDark,
      width: pWidth - 1,
    }),
  }),
];

let simplifiedLineStyle = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'white',
      width: pWidth + 2,
    }),
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
      width: pWidth,
    }),
  }),
];

let highlightedLineStyle = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'hsla(60, 100%, 50%, 0.8)',
      width: 16,
    }),
    zIndex: 1,
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'hsl(28, 100%, 45%)',
      width: pWidth + 2,
    }),
    zIndex: 1,
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'hsl(28, 100%, 65%)',
      width: pWidth,
    }),
    zIndex: 1,
  }),
];

let elevationPointStyle = [
  new ol.style.Style({
    image: new ol.style.Circle({
      radius: pWidth + 1,
      fill: new ol.style.Fill({
        color: 'red',
      }),
      stroke: new ol.style.Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  }),
];

const drawInfoOverlay = new ol.Overlay({
  offset: [10, -10],
  positioning: 'bottom-left',
  className: 'draw-info-overlay',
});

const route = useRoute();
const router = useRouter();
const { $documentUtils, $gettext, $language } = useGlobalProperties();
const { map, view } = useLayer();

const visibleSimplifiedLayer = ref(false);
const drawInfo = ref({
  distance: 0,
  bearing: 0,
});
let defaultFeaturesTitle: string;
let drawInteraction: Draw;
let drawing = false;
let elevationPoint: Feature<Point>;
let elevationPointLayer: VectorLayer<VectorSource<Feature<Point>>>;
let featuresLayer: VectorLayer<VectorSource<Line>>;
let featuresLayerSource: VectorSource<Line>;
let loadingExternalFeatures = false;
let modifyInteraction: Modify;
let simplifiedLayer: VectorLayer<VectorSource<Line>>;
let simplifiedSource: VectorSource<Line>;
let snapInteraction: Snap;
let splitInteraction: SplitInteraction;
const drawInfoElement = useTemplateRef<HTMLElement>('drawInfoElement');

const features = computed(() => Yetix.features as Line[]);

const mapZoom = computed(() => Yetix.mapZoom as number);

const zoomDelta = Yetix.ZOOM_DELTA as number;

const validMinimumMapZoom = Yetix.VALID_MINIMUM_MAP_ZOOM as number;

const editMode = computed(() => Yetix.editMode);

function getLayer() {
  return featuresLayer;
}

function addInteractions() {
  let source = featuresLayerSource;

  modifyInteraction = new ol.interaction.Modify({
    source,
    style: editStyle,
  });
  map.value.addInteraction(modifyInteraction);

  drawInteraction = new ol.interaction.Draw({
    source,
    type: 'LineString',
    style: editStyle,
    geometryFunction: (drawn, geometry) => {
      const coords = drawn as Coordinate[];
      const geom = (geometry as LineString | undefined) ?? new ol.geom.LineString([]);

      if (coords.length <= 1) {
        drawInfoOverlay.setPosition(undefined);
      }

      // get 2 last points
      if (coords.length >= 2) {
        geom.setCoordinates(coords);

        const geomCoords = geom.getCoordinates();
        let point1 = geomCoords[geomCoords.length - 2];
        let point2 = geomCoords[geomCoords.length - 1];
        let distance = ol.sphere.getDistance(ol.proj.toLonLat(point1), ol.proj.toLonLat(point2));

        let lon1 = (ol.proj.toLonLat(point1)[0] * Math.PI) / 180;
        let lon2 = (ol.proj.toLonLat(point2)[0] * Math.PI) / 180;
        let lat1 = (ol.proj.toLonLat(point1)[1] * Math.PI) / 180;
        let lat2 = (ol.proj.toLonLat(point2)[1] * Math.PI) / 180;
        let a = Math.sin(lon2 - lon1) * Math.cos(lat2);
        let b = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

        const bearing = ((Math.atan2(a, b) * 180) / Math.PI + 360) % 360;

        if (distance > 0) {
          drawInfo.value.distance = Math.round(distance);
          drawInfo.value.bearing = Math.round(bearing);
        } else {
          drawInfo.value.distance = 0;
          drawInfo.value.bearing = 0;
        }
        drawInfoOverlay.setPosition(geomCoords[geomCoords.length - 1]);
      }

      return geom;
    },
  });
  map.value.addInteraction(drawInteraction);

  splitInteraction = new SplitInteraction({
    layer: featuresLayer,
  });
  map.value.addInteraction(splitInteraction);

  snapInteraction = new ol.interaction.Snap({ source });
  map.value.addInteraction(snapInteraction);

  drawInteraction.on('drawstart', onDrawStart);
  drawInteraction.on('drawend', onDrawEnd);
  modifyInteraction.on('modifyend', onModifyEnd);
  splitInteraction.addEventListener('split', (evt) => onSplit(evt as SplitEvent));

  disableInteractions();
}

function enableInteractions() {
  drawInteraction.setActive(true);
  modifyInteraction.setActive(true);
  splitInteraction.setActive(true);
  snapInteraction.setActive(true);
}

function disableInteractions() {
  drawInteraction.setActive(false);
  modifyInteraction.setActive(false);
  splitInteraction.setActive(false);
  snapInteraction.setActive(false);

  // hide draw info overlay
  drawInfoOverlay.setPosition(undefined);
}

function onDrawStart() {
  drawing = true;
  document.addEventListener('keydown', onKeyWhileDrawing);
  document.addEventListener('keypress', onKeyWhileDrawing);
}

function onDrawEnd() {
  drawing = false;
  document.removeEventListener('keydown', onKeyWhileDrawing);
  document.removeEventListener('keypress', onKeyWhileDrawing);

  // hide draw info overlay
  drawInfoOverlay.setPosition(undefined);
}

function onModifyEnd() {
  updateFeaturesFromStore();
}

function onSplit(evt: SplitEvent) {
  evt.newFeatures.forEach(addFeature);
  removeFeature(evt.oldFeature);
}

function onKeyWhileDrawing(event: KeyboardEvent) {
  event.preventDefault();
  // backspace key
  if (event.key === 'Backspace') {
    drawInteraction.removeLastPoint();
  }
}

function onFeature(event: VectorSourceEvent<Line>) {
  // set features styles
  event.feature!.set('highlightedStyle', highlightedLineStyle);
  // emit new features, only in normal case (edit/drawing)
  // not in gpx/document case (prevent multiple update for each lines)
  if (!loadingExternalFeatures) {
    updateFeaturesFromStore();
  }
}

function updateFeaturesFromStore() {
  // updates features
  const currentFeatures = visibleSimplifiedLayer.value ? getSimplifiedFeatures() : getFeaturesLayerFeatures();
  Yetix.setFeatures(currentFeatures);
  // update length
  Yetix.setFeaturesLength(
    getFeaturesLayerFeatures()
      .map((feature) => feature.getGeometry()!.getCoordinates().length)
      .reduce((acc, value) => acc + value, 0)
  );

  if (currentFeatures.length === 0) {
    // if user come from a document url, remove url
    if (route.params.document_id) {
      router.replace({ path: '/' + String(route.name) });
    }
    // set featuresTitle back to default
    Yetix.setFeaturesTitle(defaultFeaturesTitle);
  }
}

function getFeaturesLayerFeatures() {
  return getSortedFeatures(featuresLayerSource.getFeatures());
}

function getSimplifiedFeatures() {
  return getSortedFeatures(simplifiedSource.getFeatures());
}

function removeFeature(feature: Line) {
  // remove feature
  // when only one left, ask for user to confirm
  let toBeRemoved = !(featuresLayerSource.getFeatures().length === 1 && !confirm($gettext('Confirm delete')));
  if (toBeRemoved) {
    if (visibleSimplifiedLayer.value) {
      simplifiedSource.removeFeature(feature);
      // remove corresponding feature
      getFeaturesLayerFeatures().forEach((f) => {
        if (feature.get('id') === getUid(f)) {
          featuresLayerSource.removeFeature(f);
        }
      });
    } else {
      featuresLayerSource.removeFeature(feature);
    }
    updateFeaturesFromStore();
  }
}

function removeFeatures() {
  // clear both layers
  featuresLayerSource.clear();
  simplifiedSource.clear(true);
  // set default layer to be visible
  hideSimplifiedLayer();
  // update features
  updateFeaturesFromStore();
}

function addFeaturesFromGpx(gpx: string | null) {
  // return if no gpx
  if (!gpx) {
    return;
  }
  // first, clear geometry
  featuresLayerSource.clear();

  // before reading gpx, set what we are doing
  loadingExternalFeatures = true;

  const gpxFeatures = new ol.format.GPX().readFeatures(gpx, { featureProjection: 'EPSG:3857' }) as Line[];
  gpxFeatures.forEach(addFeature);
  // update store
  Yetix.setFeaturesTitle(getFeaturesTitleFromGpx(gpxFeatures));

  // gpx is loaded, go back to normal case
  loadingExternalFeatures = false;
  // and emit new features
  updateFeaturesFromStore();
  // fit map to new features
  fitMapToFeatures();
}

function getFeaturesTitleFromGpx(gpxFeatures: Line[]) {
  if (gpxFeatures && gpxFeatures.length) {
    const properties = gpxFeatures[0].getProperties();
    if (properties.name) {
      return properties.name;
    } else {
      return $gettext('GPX file');
    }
  }
}

function addFeaturesFromDocument(doc: { data: { geometry: { geom: string; geom_detail?: string | null } } }) {
  // before reading document, set what we are doing
  loadingExternalFeatures = true;

  let documentGeometry = doc.data.geometry.geom_detail;
  if (documentGeometry) {
    addFeature(new ol.format.GeoJSON().readFeature(documentGeometry) as Line);
    // fit map to new features
    fitMapToFeatures();
  } else {
    // fit map to geom
    fitMapToGeom(doc.data.geometry.geom);
  }
  // update store
  Yetix.setFeaturesTitle(getFeaturesTitleFromDocument(doc));
  // document is loaded, go back to normal case
  loadingExternalFeatures = false;
  // and emit new features
  updateFeaturesFromStore();
}

function addFeature(feature: Feature<Geometry>) {
  const geometry = feature.getGeometry();
  // split multilinestrings into linestrings
  if (geometry instanceof MultiLineString) {
    geometry
      .getLineStrings()
      .map((line) => new ol.Feature({ geometry: line }))
      .forEach(addFeature);
  } else {
    const line = feature as Line;
    const nbPointsOnFeature = line.getGeometry()!.getCoordinates().length;
    if (nbPointsOnFeature >= 2) {
      featuresLayerSource.addFeature(line);
    }
  }
}

function getFeaturesTitleFromDocument(document: { data: object }) {
  return $documentUtils.getDocumentTitle(document.data);
}

function fitMapToFeatures() {
  const extent = ol.extent.createEmpty();

  ol.extent.extend(extent, featuresLayerSource.getExtent()!);

  view.value.fit(extent, { size: map.value.getSize() });
}

function fitMapToGeom(geom: string) {
  const geometry = (new ol.format.GeoJSON().readFeature(geom) as Feature).getGeometry()!.getExtent();
  view.value.fit(geometry, { size: map.value.getSize() });
  view.value.setZoom(validMinimumMapZoom / zoomDelta);
}

function hideSimplifiedLayer() {
  featuresLayer.setVisible(true);
  simplifiedLayer.setVisible(false);
  visibleSimplifiedLayer.value = false;
}

function showSimplifiedLayer() {
  featuresLayer.setVisible(false);
  simplifiedLayer.setVisible(true);
  visibleSimplifiedLayer.value = true;
}

function previewSimplify(tolerance: number) {
  // every preview, clear the layer first
  simplifiedSource.clear(true);
  // show/hide layers based on tolerance
  if (tolerance === 0) {
    hideSimplifiedLayer();
  } else {
    showSimplifiedLayer();
    // get each features, simplify them, and add to simplified layer
    getFeaturesLayerFeatures().forEach((feature) => {
      // clone geometry
      const simplifiedGeometry = feature.getGeometry()!.clone();
      let coordinates = simplifiedGeometry.getCoordinates();

      // if no z, add 0
      coordinates = coordinates.map((coord) => {
        if (!coord[2]) {
          coord[2] = 0;
        }
        return coord;
      });

      // check if tolerance is 0 == no simplification
      if (tolerance !== 0) {
        coordinates = simplify(coordinates, tolerance, true);
        simplifiedGeometry.setCoordinates(coordinates);
      }

      // create feature (store reference of actual feature thanks to ol_uid)
      const simplifiedFeature = new ol.Feature({ geometry: simplifiedGeometry, id: getUid(feature) });
      simplifiedSource.addFeature(simplifiedFeature);
    });
  }
  updateFeaturesFromStore();
}

// applies the simplified preview (named apart from the simplify() of ./simplify)
function applySimplify() {
  // clear features layer
  featuresLayerSource.clear();
  // get simplified features
  let simplifiedFeatures = getSimplifiedFeatures();
  // and move them one by one (to keep order of line chunks) in features layer
  simplifiedFeatures.forEach((feature) => {
    featuresLayerSource.addFeature(feature);
  });
  // hide simplified/show features
  hideSimplifiedLayer();
}

function onElevationProfile(event: unknown) {
  const { action, coord } = event as { action: string; coord: Coordinate };
  switch (action) {
    case 'cursor_move':
      elevationPointLayer.setVisible(true);
      elevationPoint.setGeometry(new ol.geom.Point(coord));
      break;
    case 'cursor_end':
      elevationPointLayer.setVisible(false);
      break;
  }
}

function updateEditStyle() {
  featuresLayer.setStyle(
    editMode.value && mapZoom.value >= validMinimumMapZoom ? normalWithEditLineStyle : normalLineStyle
  );
}

function onKeydown(evt: KeyboardEvent) {
  // not when drawing
  if (drawing) {
    return false;
  }
  // not when both alt+ctrl
  if (evt.ctrlKey && evt.altKey) {
    return false;
  }
  // which key?
  let tip: string | null = null;
  let svgSource = '';
  if (evt.ctrlKey) {
    tip = $gettext('Split line');
    svgSource = icon({ prefix: 'fas', iconName: 'scissors' })!.html[0];
  }
  if (evt.altKey) {
    tip = $gettext('Add or remove point');
    svgSource = icon({ prefix: 'fas', iconName: 'plus-minus' })!.html[0];
  }

  // add new icon in editstyle, only if length is 3
  if (tip && editStyle.length === 3) {
    svgSource = svgSource.replace('<svg', '<svg width="10" height="10"');
    svgSource = svgSource.replace('fill="currentColor"', `fill="white" stroke="${pColorDark}" stroke-width="5"`);
    editStyle.splice(
      1,
      0,
      new ol.style.Style({
        image: new ol.style.Icon({
          src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgSource),
          size: [10, 10],
        }),
      })
    );
    (editStyle[0].getImage() as CircleStyle).setRadius(10);
    editStyle[0].setText(
      new ol.style.Text({
        text: tip,
        textAlign: 'left',
        offsetX: 20,
        offsetY: 0,
        padding: [5, 5, 5, 5],
        fill: new ol.style.Fill({
          color: 'white',
        }),
        backgroundFill: new ol.style.Fill({
          color: pColorDark,
        }),
      })
    );
    drawInteraction.getOverlay().setStyle(editStyle);
    modifyInteraction.getOverlay().setStyle(editStyle);
  }
}

function onKeyup(evt: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey'>) {
  // remove specific icon
  // only when alt or ctrl, but not both, and icon is already in editstyle
  if (((evt.key === 'Alt' && !evt.ctrlKey) || (evt.key === 'Control' && !evt.altKey)) && editStyle.length === 4) {
    editStyle.splice(1, 1);
    (editStyle[0].getImage() as CircleStyle).setRadius(6);
    editStyle[0].setText(
      new ol.style.Text({
        text: undefined,
      })
    );
    drawInteraction.getOverlay().setStyle(editStyle);
    modifyInteraction.getOverlay().setStyle(editStyle);
  }
}

watch(editMode, () => {
  if (!editMode.value) {
    disableInteractions();
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('keyup', onKeyup);
  } else {
    enableInteractions();
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('keyup', onKeyup);
  }
  updateEditStyle();
});

watch(mapZoom, () => {
  updateEditStyle();
});

const onWindowBlur = () => onKeyup({ key: 'Control', altKey: false, ctrlKey: false });

// what the panels ask the layer, through the yeti event bus
// typed by each handler: the bus gives the payload as unknown
const EVENT_HANDLERS: [string, Handler][] = [
  ['addFeature', addFeature as Handler],
  ['removeFeature', removeFeature as Handler],
  ['removeFeatures', removeFeatures as Handler],
  ['gpx', addFeaturesFromGpx as Handler],
  ['previewSimplify', previewSimplify as Handler],
  ['simplify', applySimplify as Handler],
  ['featureUpdated', updateFeaturesFromStore as Handler],
  ['fit-map-to-features', fitMapToFeatures as Handler],
];

onMounted(() => {
  // features layer
  featuresLayer = new ol.layer.Vector({
    source: new ol.source.Vector<Line>(),
    style: normalLineStyle,
  });
  featuresLayer.set('name', 'routeLayer');
  featuresLayerSource = featuresLayer.getSource()!;

  map.value.addLayer(featuresLayer);

  // draw info overlay
  drawInfoOverlay.setElement(drawInfoElement.value!);
  map.value.addOverlay(drawInfoOverlay);

  // simplified layer (preview)
  simplifiedLayer = new ol.layer.Vector({
    source: new ol.source.Vector<Line>(),
    style: simplifiedLineStyle,
  });
  // get source
  simplifiedSource = simplifiedLayer.getSource()!;
  // add layer, and hide it
  map.value.addLayer(simplifiedLayer);
  simplifiedLayer.setVisible(false);

  // layer for elevation point
  elevationPointLayer = new ol.layer.Vector({
    source: new ol.source.Vector<Feature<Point>>(),
    style: elevationPointStyle,
  });
  // add layer, and hide it
  map.value.addLayer(elevationPointLayer);
  elevationPointLayer.setVisible(false);
  // add one feature for point
  const elevationPointSource = elevationPointLayer.getSource()!;
  elevationPoint = new ol.Feature<Point>();
  elevationPointSource.addFeature(elevationPoint);
  // react to event
  yetixEvents.on('elevationProfile', onElevationProfile);

  // set default featuresTitle
  defaultFeaturesTitle = $gettext(Yetix.featuresTitle as string);
  Yetix.setFeaturesTitle(defaultFeaturesTitle);

  // load camptocamp document
  const doc = route.params.document_id;
  if (doc) {
    (c2c.route as DocumentService)
      .getCooked(Number(doc), $language.current!)
      .then((response) => addFeaturesFromDocument(response as never));
  }

  // features events (added feature)
  featuresLayerSource.on('addfeature', onFeature);
  simplifiedSource.on('addfeature', onFeature);

  addInteractions();

  EVENT_HANDLERS.forEach(([event, handler]) => yetixEvents.on(event, handler));

  // special event when window loose focus = hanfle ctrl key (when browser shorcuts) for split interaction
  window.addEventListener('blur', onWindowBlur);

  // already features to add?
  // but not a c2c document
  if (!doc && features.value.length) {
    featuresLayerSource.addFeatures(features.value);
  }
});

// they stayed after leaving the page
onBeforeUnmount(() => {
  EVENT_HANDLERS.forEach(([event, handler]) => yetixEvents.off(event, handler));
  yetixEvents.off('elevationProfile', onElevationProfile);
  window.removeEventListener('blur', onWindowBlur);
  document.removeEventListener('keydown', onKeydown);
  document.removeEventListener('keyup', onKeyup);
  document.removeEventListener('keydown', onKeyWhileDrawing);
  document.removeEventListener('keypress', onKeyWhileDrawing);
});

defineExpose({ getLayer });
</script>

<style>
.draw-info-overlay {
  background: yellow;
  padding: 2px;
  border-radius: 2px;
  font-size: 0.85rem;
  min-width: 60px;
}
</style>
