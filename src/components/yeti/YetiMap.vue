<template>
  <div ref="rootElement" class="column map-container">
    <div style="width: 100%; height: 100%">
      <yeti-map-legend />
      <div ref="mapElement" style="width: 100%; height: 100%" />
      <map-layers />
      <yeti-layers />
      <overlays-layers />

      <div ref="recenterOnControl" class="ol-control ol-control-recenter-on">
        <input type="text" :placeholder="$gettext('Recenter on...')" @input="searchRecenterPropositions" />
      </div>

      <div
        v-show="showRecenterOnPropositions"
        ref="recenterOnPropositions"
        class="ol-control ol-control-recenter-on-propositions"
      >
        <ul v-if="recenterPropositions && recenterPropositions.data && recenterPropositions.data.features">
          <li v-for="(item, i) of recenterPropositions.data.features" :key="i" @click="recenterOn(item)">
            {{ item.properties.name }},
            <small>{{ item.properties.state }}, {{ item.properties.country }}</small>
          </li>
        </ul>
      </div>

      <div
        ref="centerOnGeolocation"
        :title="$gettext('Recenter on your current position')"
        class="ol-control ol-control-center-on-geolocation"
      >
        <button @click="activateCenterOnGeolocation">
          <fa-icon icon="bullseye" />
        </button>
      </div>

      <div ref="editMode" style="height: 0">
        <edit-mode-button />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type MapBrowserEvent from 'ol/MapBrowserEvent';
import { computed, onMounted, provide, ref, useTemplateRef } from 'vue';

import MapLayers from './map-layers/MapLayers.vue';
import OverlaysLayers from './map-layers/OverlaysLayers.vue';
import YetiLayers from './map-layers/YetiLayers.vue';

import EditModeButton from '@/components/yeti/EditModeButton.vue';
import YetiMapLegend from '@/components/yeti/YetiMapLegend.vue';
import Yetix from '@/components/yeti/yetix';
import yetixEvents from '@/components/yeti/yetix-events';
import photon from '@/js/apis/photon';
import { useGlobalProperties } from '@/js/composables/global-properties';
import ol from '@/js/libs/ol';
import { getPreferences } from '@/js/vue-plugins/local-storage';

// a place found by Photon, to recenter the map on
type PhotonFeature = { properties: Record<string, string | undefined> };

const DEFAULT_CENTER = [6.25, 45.15];
const DEFAULT_ZOOM = 6;
const MAX_ZOOM = 19;
const TRACKING_INITIAL_ZOOM = 13;

// stored under the name the component had, as before: existing preferences are kept
const preferences = getPreferences('Yeti');

const { $gettext, $language } = useGlobalProperties();

const recenterPropositions = ref<{ data?: { features: PhotonFeature[] } | null } | null>(null);
const showRecenterOnPropositions = ref(false);

const rootElement = useTemplateRef<HTMLElement>('rootElement');
const mapElement = useTemplateRef<HTMLElement>('mapElement');
const editModeControl = useTemplateRef<HTMLElement>('editMode');
const recenterOnControl = useTemplateRef<HTMLElement>('recenterOnControl');
const recenterOnPropositionsControl = useTemplateRef<HTMLElement>('recenterOnPropositions');
const centerOnGeolocationControl = useTemplateRef<HTMLElement>('centerOnGeolocation');

const mapZoom = computed(() => Yetix.mapZoom as number);
const zoomDelta = Yetix.ZOOM_DELTA as number;

// build map
const map = new ol.Map({
  controls: [
    new ol.control.Zoom({
      zoomInTipLabel: $gettext('Zoom in', 'Map controls'),
      zoomOutTipLabel: $gettext('Zoom out', 'Map controls'),
    }),
    new ol.control.ScaleLine(),
    new ol.control.Attribution({ tipLabel: $gettext('Attributions', 'Map controls') }),
  ],

  view: new ol.View({
    center: ol.proj.transform(DEFAULT_CENTER, 'EPSG:4326', 'EPSG:3857'),
    zoom: DEFAULT_ZOOM / zoomDelta,
    maxZoom: MAX_ZOOM / zoomDelta,
    enableRotation: false,
    constrainResolution: true,
    zoomFactor: 2 ** zoomDelta,
  }),
});
const view = map.getView();

// if already a stored map position
if (preferences.get('yeti-map-position')) {
  const { center, zoom } = preferences.get('yeti-map-position') as { center: number[]; zoom: number };
  view.setCenter(center);
  view.setZoom(zoom / zoomDelta);
}

const geolocation = new ol.Geolocation({
  trackingOptions: {
    enableHighAccuracy: true,
  },
  projection: view.getProjection(),
});

function getExtent(projection?: string) {
  let extent = view.calculateExtent(map.getSize());
  if (projection) {
    extent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857')!, ol.proj.get(projection)!);
  }
  return extent;
}

// the layers reach the map and its extent through this, at any depth
provide('yetiMap', {
  get map() {
    return map;
  },
  getExtent,
});

function searchRecenterPropositions(event: Event) {
  const query = (event.target as HTMLInputElement).value;

  if (query && query.length >= 3) {
    const centerWgs84 = ol.proj.toLonLat(view.getCenter()!) as [number, number];

    recenterPropositions.value = photon.getPropositions(query, $language.current!, centerWgs84);
    showRecenterOnPropositions.value = true;
  }
}

function recenterOn(item: PhotonFeature) {
  const feature = new ol.format.GeoJSON().readFeature(item) as InstanceType<
    typeof ol.Feature<InstanceType<typeof ol.geom.Point>>
  >;
  let extent = feature.get('extent');
  let coordinates = feature.getGeometry()!.getCoordinates();

  if (extent) {
    extent = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
    view.fit(extent, { size: map.getSize(), maxZoom: 12 / zoomDelta });
  } else {
    coordinates = ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857');
    view.setCenter(coordinates);
    view.setZoom(16 / zoomDelta);
  }

  showRecenterOnPropositions.value = false;
}

function getMapZoom() {
  return Math.round(new ol.View().getZoomForResolution(map.getView().getResolution()!)! * 10) / 10;
}

function onMapMoveEnd() {
  const zoom = getMapZoom();
  // emit map zoom, only if zoom changed
  if (mapZoom.value !== zoom) {
    Yetix.setMapZoom(zoom);
  }
  // emit an event for map layers
  yetixEvents.emit('map-moveend');

  // store position
  preferences.set('yeti-map-position', {
    center: map.getView().getCenter(),
    zoom,
  });
}

function onMapClick(evt: MapBrowserEvent<PointerEvent>) {
  // close controls
  showRecenterOnPropositions.value = false;

  yetixEvents.emit('map-click', evt);
}

function onMapPointerMove(evt: MapBrowserEvent<PointerEvent>) {
  yetixEvents.emit('map-pointermove', evt);
}

function activateCenterOnGeolocation() {
  geolocation.setTracking(true);
}

function setCenterOnGeoLocation() {
  view.setZoom(TRACKING_INITIAL_ZOOM / zoomDelta);
  view.setCenter(geolocation.getPosition());
  geolocation.setTracking(false);
}

onMounted(() => {
  // when mounted, bind map to element
  map.setTarget(mapElement.value!);
  // add specific controls
  [
    new ol.control.FullScreen({ source: rootElement.value!, tipLabel: $gettext('Toggle full-screen', 'Map Controls') }),
    new ol.control.Control({ element: editModeControl.value! }),
    new ol.control.Control({ element: recenterOnControl.value! }),
    new ol.control.Control({ element: recenterOnPropositionsControl.value! }),
    new ol.control.Control({ element: centerOnGeolocationControl.value! }),
  ].forEach((control) => map.addControl(control));

  // events
  map.on('moveend', onMapMoveEnd);
  map.on('click', (evt) => onMapClick(evt as MapBrowserEvent<PointerEvent>));
  map.on('pointermove', (evt) => onMapPointerMove(evt as MapBrowserEvent<PointerEvent>));
  geolocation.on('change:position', setCenterOnGeoLocation);
});

// YetiView checks the extent of the risk
defineExpose({ getExtent });
</script>

<style scoped lang="scss">
@import 'ol/ol.css';
@import '@/assets/sass/variables';

$control-margin: 0.52em;

.ol-control-layer-switcher {
  bottom: 3em;
  left: $control-margin;
  right: $control-margin;
  max-width: 400px;
  text-decoration: none;
  background-color: white;
  border: 1px solid lightgray;
  border-radius: 2px;
  padding: 0 10px 10px 10px;
  display: flex;

  & > div {
    flex: 1;

    header {
      font-weight: bold;
      padding-top: 10px;
    }
  }
}

.ol-control-layer-switcher-button {
  bottom: $control-margin;
  left: $control-margin;
}

.ol-control-recenter-on {
  top: $control-margin;
  left: 3em;
  background: $white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);

  input {
    width: 14.75rem;
    border: none;
    padding: 0.3rem;
    border-radius: 2px;
  }
}

.ol-control-recenter-on-propositions {
  top: 35px;
  left: 3em;
  background: white;
  border-radius: 2px;
  border: 1px solid lightgray;
  padding: 5px;

  li:hover {
    background: lightgrey;
    cursor: pointer;
  }
}

.ol-control-center-on-geolocation {
  top: 92px;
  left: $control-margin;
}

.map-control-listitem {
  display: flex;
}
.map-control-listitem label {
  padding-left: 0.25rem;
}

$section-padding: 1.5rem; //TODO find this variable
$box-padding: 1.25rem; //TODO find this variable
$header-height: 34px;
$box-margin: 1.5rem; //TODO find this variable
$yeti-height: calc(
  100vh - #{$navbar-height} - #{$section-padding} - 2 * #{$box-padding} - #{$header-height} - #{$box-margin} -
    #{$box-margin}
);

.map-container {
  position: relative;
  padding-left: 0;
}
@media screen and (max-width: $tablet) {
  .map-container {
    height: $yeti-height;
    padding-left: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
}

@media screen and (min-width: $tablet) {
  .yeti-content {
    .map-container {
      min-height: 100%;
    }
  }
}

.ol-control-edit-mode {
  top: $control-margin;
  left: 18.75rem;
}

@media screen and (max-width: $widescreen) {
  .ol-control-edit-mode {
    top: 3rem;
    left: 3rem;
  }
}

.icon-notification {
  color: $primary;
}
</style>

<style lang="scss">
.yeti-app {
  .ol-control {
    background: $white;
    padding: 2px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
  }
  .ol-control button {
    background: $grey-dark;
    color: $white;

    &:hover,
    &:focus {
      background: $grey;
      outline: none;
    }
  }
  .ol-control > * {
    line-height: 1;
  }

  .ol-attribution {
    max-width: 75%;
  }
}
</style>
