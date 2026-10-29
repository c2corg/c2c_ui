<template>
  <div class="box no-print">
    <div v-if="document.areas && document.areas.length" class="has-text-centered">
      <icon-area />
      <span>&nbsp;</span>
      <span v-for="area of document.areas" :key="area.document_id" class="area-link">
        <!-- the space as an expression: Vue 3 drops a whitespace-only text at the end of an element, &#0032; included -->
        <document-link :document="area" />{{ ' ' }}
      </span>
    </div>

    <!-- The fullscreen map container is used to display both the map
         and the elevation profile in fullscreen (if the elevation profile exists) -->
    <div id="fullscreen-map-container">
      <div
        class="map-container"
        :class="{
          'with-elevation-profile': showElevationProfile && !elevationProfileHidden,
          pinned: pinnedMode,
          'pinned-to-top': pinnedSide === 'top',
          'pinned-to-right': pinnedSide === 'right',
          'fill-parent': !pinnedMode,
        }"
      >
        <map-view
          ref="olMap"
          :documents="new Array(document)"
          :show-protection-areas="['r', 'w'].includes(document.type!)"
          :biodiv-sports-activities="document.activities"
          :full-screen-element-id="
            !$screen.isMobile && showElevationProfile && elevationProfileHasData ? 'fullscreen-map-container' : null
          "
          :show-pin-to-top-button="true"
          @has-protection-area="$emit('has-protection-area')"
          @pin-to-top-clicked="togglePinToSide(true)"
        />
      </div>

      <elevation-profile :document="document" v-if="showElevationProfile" @has-data="elevationProfileHasData = true" />
    </div>

    <div class="buttons is-centered">
      <button v-if="showDownloadTraceButtons" class="button is-primary is-small" @click="downloadGpx">GPX</button>
      <button v-if="showDownloadTraceButtons" class="button is-primary is-small" @click="downloadKml">KML</button>
      <button
        v-if="hasMapLinks"
        class="button is-small"
        @click="mapLinksAreVisible = !mapLinksAreVisible"
        :class="{ 'is-success': mapLinksAreVisible }"
      >
        <icon-map />
      </button>
    </div>
    <map-links v-if="mapLinksAreVisible" :document="document" />
  </div>
</template>

<script setup lang="ts">
import type { Feature } from 'ol';
import type FeatureFormat from 'ol/format/Feature';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

import ElevationProfile from './ElevationProfile.vue';
import MapLinks from './MapLinks.vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import bus from '@/js/event-bus';
import ol from '@/js/libs/ol';
import { documentProperty, useDocumentType } from '@/js/properties';
import utils from '@/js/utils';

const GeoJSON = new ol.format.GeoJSON();

const props = defineProps({ ...documentProperty });

defineEmits(['has-protection-area']);

const route = useRoute();
const { $documentUtils } = useGlobalProperties();
const { documentType } = useDocumentType(props);

// named apart from the map-view tag
const olMap = useTemplateRef<{ fitMapToDocuments(): void }>('olMap');

const mapLinksAreVisible = ref(false);
const elevationProfileHasData = ref(false);
const elevationProfileHidden = ref(false);
const pinnedMode = ref(0);
const pinnedSide = ref('');

const showElevationProfile = computed(() => documentType.value === 'outing');

const showDownloadTraceButtons = computed(
  () => props.document.geometry && (props.document.geometry.geom_detail || documentType.value === 'waypoint')
);

const hasMapLinks = computed(
  () => (props.document.maps && props.document.maps.length !== 0) || props.document.maps_info
);

function onElevationProfile(event: unknown) {
  const { action, hide } = event as { action: string; hide: boolean };
  if (action === 'toggle_fullscreen') {
    elevationProfileHidden.value = hide;
  }
}

function togglePinToSide(toggle: boolean) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const breakMobile = 769;
  // disable eg pin-to-right on mobile
  const maxMode = width < breakMobile || height < breakMobile ? 2 : 3;

  const toggleAmount = toggle ? 1 : 0;
  // 0: unpinned / 1: pinned side1 / 2: pinned side2
  pinnedMode.value = (pinnedMode.value + toggleAmount) % maxMode;

  // side1 is the preferred side for comfort, ie the larger dimension
  const [side1, side2] = width < height * 1.5 ? ['top', 'right'] : ['right', 'top'];
  pinnedSide.value = pinnedMode.value === 0 ? '' : pinnedMode.value === 1 ? side1 : side2;

  // the document prop shadows the global document
  const body = window.document.body;
  if (pinnedSide.value === 'right') {
    body.style.paddingRight = '30%';
    body.style.paddingTop = '';
  } else if (pinnedSide.value === 'top') {
    body.style.paddingRight = '';
    body.style.paddingTop = '45vh'; // as % is relative to width
  } else {
    body.style.paddingRight = '';
    body.style.paddingTop = '';
  }
  setTimeout(() => {
    // deferred so that map.getSize() gets updated
    if (olMap.value) {
      olMap.value.fitMapToDocuments();
    }
  });
}

function resizePin() {
  togglePinToSide(false);
}

function downloadKml() {
  downloadFeatures(new ol.format.KML(), '.kml', 'application/vnd.google-earth.kml+xml');
}

function downloadGpx() {
  downloadFeatures(new ol.format.GPX(), '.gpx', 'application/gpx+xml');
}

function downloadFeatures(format: FeatureFormat, extension: string, mimetype: string) {
  const geometry = props.document.geometry!;
  let features: Feature[] = [];
  if (geometry.geom_detail) {
    features = GeoJSON.readFeatures(geometry.geom_detail);
  } else if (geometry.geom) {
    features = GeoJSON.readFeatures(geometry.geom);
  }
  if (!features.length) {
    return;
  }

  // Export only the current document geometry, not the associated features
  const feature = features[0];
  const name = $documentUtils.getDocumentTitle(props.document, route.params.lang as string);

  feature.set('name', name);

  const filename = getDownloadedFileName(name, extension);
  const content = format.writeFeatures([feature], {
    featureProjection: 'EPSG:3857',
  }) as string;

  utils.download(content, filename, mimetype + ';charset=utf-8');
}

function getDownloadedFileName(name: string, extension: string) {
  let filename = props.document.document_id + '_' + name.substring(0, 100);
  if (documentType.value === 'outing') {
    filename = filename + '_' + props.document.date_start;
  }
  // Remove forbidden characters/spaces, and replace them with '_'
  return filename.replace(/[/\\?%*:|"<>]/g, ' ').replace(/\s+/g, '_') + extension;
}

onMounted(() => {
  bus.on('elevation_profile', onElevationProfile);
  window.addEventListener('resize', resizePin);
});

onBeforeUnmount(() => {
  bus.off('elevation_profile', onElevationProfile);
  window.removeEventListener('resize', resizePin);
  if (pinnedMode.value) togglePinToSide(true);
  if (pinnedMode.value) togglePinToSide(true);
});
</script>

<style lang="scss" scoped>
@import 'bulma/sass/utilities/mixins.sass';

.map-container {
  margin-top: 1rem;
  margin-bottom: 1rem;
  background: beige;

  &.fill-parent {
    height: 275px;
  }
}

:not(:fullscreen) > .map-container {
  &.pinned {
    position: fixed;
    top: $navbar-height;
    margin-top: 0; /*avoid space between nav and map, where body text can be seen while scrolling*/
    z-index: 10; /* on top of body but below navbar (z=25) and side-menu (z=30) */
    box-shadow: 1px 1px 4px 0 rgba(0, 0, 0, 0.4); // <o-x> <o-y> <radius>
  }
  &.pinned-to-top {
    right: 0px;
    height: 45vh;
    width: 100%;
    @include desktop {
      left: $sidemenu-width; /* when sidemenu is shown, as in App.vue */
    }
  }
  &.pinned-to-right {
    right: 0px;
    height: calc(100vh - #{$navbar-height});
    width: 30vw;
  }
}

/**
 * Fullscreen mode *with* elevation profile
 * Without the elevation profile it's the map-view
 * element that goes into fullscreen mode, so the
 * rule doesn't apply
 */
:fullscreen .map-container {
  height: 100%;
  max-height: 100%;
  margin: 0;

  &.with-elevation-profile {
    height: 70%;
    max-height: calc(100% - 200px);
    min-height: calc(100% - 350px);
  }
}
</style>
