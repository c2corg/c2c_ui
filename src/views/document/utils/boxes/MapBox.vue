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
    <div id="fullscreen-map-container" :class="{ 'full-window': fullWindow }">
      <div
        class="map-container"
        :class="{
          'with-elevation-profile': showElevationProfile && elevationProfileHasData && !elevationProfileHidden,
          pinned: pinnedMode && !fullWindow,
          'pinned-to-top': pinnedSide === 'top',
          'pinned-to-right': pinnedSide === 'right',
          'fill-parent': !pinnedMode,
        }"
      >
        <map-view
          ref="olMap"
          :documents="new Array(document)"
          :show-protection-areas="['r', 'w'].includes(document.type!)"
          :tracks-filters="overlayFilters.outing"
          :routes-filters="overlayFilters.route"
          :biodiv-sports-activities="document.activities"
          :full-screen-element-id="
            !$screen.isMobile && showElevationProfile && elevationProfileHasData ? 'fullscreen-map-container' : null
          "
          :show-pin-to-top-button="true"
          remember-settings
          :pinned-side="pinnedSide"
          :show3d="show3d"
          @has-protection-area="$emit('has-protection-area')"
          @pin-to-top-clicked="onPinClicked"
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
        :aria-label="$gettext('maps')"
        :aria-expanded="mapLinksAreVisible"
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
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

import ElevationProfile from './ElevationProfile.vue';
import MapLinks from './MapLinks.vue';

import { documentOverlayFilters } from '@/components/map/density-overlays';
import { parseMapUrl, storedPin, storePin } from '@/components/map/map-url-state';
import { useGlobalProperties } from '@/js/composables/global-properties';
import bus from '@/js/event-bus';
import { writeGpx, writeKml, type ExportedFeature } from '@/js/geo/formats';
import { documentProperty, useDocumentType } from '@/js/properties';
import utils from '@/js/utils';

const props = defineProps({ ...documentProperty });

defineEmits(['has-protection-area']);

const route = useRoute();

// the 3D view for routes, outings and waypoints: around their waypoints (an outing: those of its routes) or their point
// when they have no track
const show3d = computed(() => ['r', 'o', 'w'].includes(props.document.type!));
const { $documentUtils } = useGlobalProperties();
const { documentType } = useDocumentType(props);
// the "Tracks" and "Routes" overlays of the map show what is linked to the document
const overlayFilters = computed(() => documentOverlayFilters(props.document));

// named apart from the map-view tag
const olMap = useTemplateRef<{ fitMapToDocuments(): void }>('olMap');

const mapLinksAreVisible = ref(false);
const elevationProfileHasData = ref(false);
const elevationProfileHidden = ref(false);
// 0: unpinned / 1: pinned side1 / 2: pinned side2 (not on a phone) / 3: the whole window below the navbar
const pinnedMode = ref(0);
const FULL_WINDOW = 3;
// '', 'top', 'right' or 'window'
const pinnedSide = ref('');
const fullWindow = computed(() => pinnedSide.value === 'window');

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
  const isPhone = width < breakMobile || height < breakMobile;

  let mode = toggle ? (pinnedMode.value + 1) % (FULL_WINDOW + 1) : pinnedMode.value;
  if (isPhone && mode === 2) mode = toggle ? FULL_WINDOW : 0;
  setPinnedMode(mode);
}

// a click on the pin button: the side is kept on this device, for the next document pages (storePin)
function onPinClicked() {
  togglePinToSide(true);
  storePin(pinnedSide.value);
}

function setPinnedMode(mode: number) {
  pinnedMode.value = mode;

  // side1 is the preferred side for comfort, ie the larger dimension
  const [side1, side2] = window.innerWidth < window.innerHeight * 1.5 ? ['top', 'right'] : ['right', 'top'];
  pinnedSide.value = ['', side1, side2, 'window'][mode];

  // the document prop shadows the global document
  const body = window.document.body;
  body.style.paddingRight = pinnedSide.value === 'right' ? '30%' : '';
  body.style.paddingTop = pinnedSide.value === 'top' ? '45vh' : ''; // as % is relative to width
  // the page under the full window map does not scroll
  window.document.documentElement.style.overflow = fullWindow.value ? 'hidden' : '';

  setTimeout(() => {
    // deferred so that map.getSize() gets updated
    if (olMap.value) {
      olMap.value.fitMapToDocuments();
    }
  });
}

// Esc leaves the full window map (in the OS full screen, the browser takes it to leave the full screen first)
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && fullWindow.value && !window.document.fullscreenElement) {
    setPinnedMode(0);
    storePin('');
  }
}

function resizePin() {
  togglePinToSide(false);
}

function downloadKml() {
  downloadFeature(writeKml, '.kml', 'application/vnd.google-earth.kml+xml');
}

function downloadGpx() {
  downloadFeature(writeGpx, '.gpx', 'application/gpx+xml');
}

// only the geometry of the document, not the associated documents
function downloadFeature(write: (features: ExportedFeature[]) => string, extension: string, mimetype: string) {
  const { geom_detail: geomDetail, geom } = props.document.geometry!;
  if (!geomDetail && !geom) {
    return;
  }
  const name = $documentUtils.getDocumentTitle(props.document, route.params.lang as string);
  const content = write([{ name, geometry: JSON.parse((geomDetail ?? geom)!) }]);
  utils.download(content, getDownloadedFileName(name, extension), mimetype + ';charset=utf-8');
}

function getDownloadedFileName(name: string, extension: string) {
  let filename = props.document.document_id + '_' + name.substring(0, 100);
  if (documentType.value === 'outing') {
    filename = filename + '_' + props.document.date_start;
  }
  // Remove forbidden characters/spaces, and replace them with '_'
  return filename.replace(/[/\\?%*:|"<>]/g, ' ').replace(/\s+/g, '_') + extension;
}

// pins the map on the side (or the whole window) asked for by the link of the page (?pin=top), else on the side kept on this
// device; a side that is not available here (the right one on a phone) gives the first one
function pinAtStart() {
  const pin = parseMapUrl(route.query).pin ?? storedPin();
  if (!pin) return;
  // 0: unpinned, then the sides, in the order of this screen, then the whole window
  for (let i = 0; i < FULL_WINDOW; i++) {
    togglePinToSide(true);
    if (pinnedSide.value === pin) return;
  }
  // the second side does not exist here (a phone): the first one this screen offers
  setPinnedMode(1);
}

onMounted(() => {
  pinAtStart();
  bus.on('elevation_profile', onElevationProfile);
  window.addEventListener('resize', resizePin);
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  bus.off('elevation_profile', onElevationProfile);
  window.removeEventListener('resize', resizePin);
  window.removeEventListener('keydown', onKeydown);
  if (pinnedMode.value) setPinnedMode(0);
});
</script>

<style scoped>
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
    top: var(--c2c-navbar-height);
    margin-top: 0; /*avoid space between nav and map, where body text can be seen while scrolling*/
    z-index: 10; /* on top of body but below navbar (z=25) and side-menu (z=30) */
    box-shadow: 1px 1px 4px 0 rgba(0, 0, 0, 0.4); /* <o-x> <o-y> <radius> */
  }
  &.pinned-to-top {
    right: 0px;
    height: 45vh;
    width: 100%;
  }
  &.pinned-to-right {
    right: 0px;
    height: calc(100vh - var(--c2c-navbar-height));
    width: 30vw;
  }
}

/* on wide screens the navbar is taller, with the ad (.nav-dfm, App.vue): below it, or it hides the top of the map */
.nav-dfm :not(:fullscreen) > .map-container {
  &.pinned {
    top: var(--c2c-navbarad-height);
  }
  &.pinned-to-right {
    height: calc(100vh - var(--c2c-navbarad-height));
  }
}

/* the whole window below the navbar, with the elevation profile of an outing as in full screen */
.full-window:not(:fullscreen) {
  position: fixed;
  top: var(--c2c-navbar-height);
  right: 0;
  bottom: var(--c2c-bottom-bar-height);
  left: 0;
  z-index: 10; /* as a pinned map */
  background: white;
}

/* beside the side menu, where it is shown (data-shell, as App.vue) */
html[data-shell='desktop'] {
  :not(:fullscreen) > .map-container.pinned-to-top,
  .full-window:not(:fullscreen) {
    left: var(--c2c-sidemenu-width);
  }
}

.nav-dfm .full-window:not(:fullscreen) {
  top: var(--c2c-navbarad-height);
}

/**
 * Fullscreen mode *with* elevation profile
 * Without the elevation profile it's the map-view
 * element that goes into fullscreen mode, so the
 * rule doesn't apply
 */
:is(:fullscreen, .full-window) .map-container {
  height: 100%;
  max-height: 100%;
  margin: 0;

  &.with-elevation-profile {
    height: 70%;
    max-height: calc(100% - 200px);
    min-height: calc(100% - 350px);
  }
}

/* the dark theme of the app (src/stores/app-settings.ts, App.vue): the box around the tiles while they load */
html[data-theme='dark'] :is(.map-container, .full-window) {
  background: var(--app-dark-surface);
}
</style>
