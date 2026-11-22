<template>
  <!-- the waypoints on a map filling the page, with the density of the outings and of the routes further out -->
  <div class="waypoints-map-view">
    <html-header :title="$gettext('map')" />
    <map-view
      v-if="route.query.bbox"
      :key="mapKey"
      :documents="waypoints"
      :highlighted-document="highlightedDocument"
      :tracks-filters="overlayFilters.outing"
      :routes-filters="overlayFilters.route"
      sync-url
      force-filter
      compact-markers
      :monochrome-markers="route.query[MONOCHROME_URL_KEY] === 'true'"
      show-center-on-geolocation
      show-recenter-on
      show3d
      @highlight-document="highlightedDocument = $event"
      @zoom="zoom = $event"
    />
    <div v-if="hint" class="map-hint" role="status">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { EUROPE_BBOX, WIDE_BBOX } from '@/components/map/default-extents';
import { searchOverlayFilters } from '@/components/map/density-overlays';
import { MONOCHROME_URL_KEY, withoutDisplaySettings } from '@/components/map/map-url-keys';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

// the waypoints are shown from this zoom, at most this many (those of a view of a dense area fit); further out, the
// overlays show where the routes and the outings are. In OpenLayers zooms, as the other levels of the map (the tracks of
// the overlays from 13): the one of MapLibre plus one
const WAYPOINTS_MIN_ZOOM = 11;
const WAYPOINTS_LIMIT = 500;
const ROUTE_NAME = 'waypoints-map';

const route = useRoute();
const router = useRouter();
const { $gettext, $language, $screen } = useGlobalProperties();

const zoom = ref<number | null>(null);
const waypoints = ref<C2cDocument[]>([]);
const total = ref(0);
const highlightedDocument = ref<C2cDocument>();
// a new map for a link without an extent (the menu entry, clicked again): it opens on the default one
const mapKey = ref(0);

// the search filters of the link apply to the overlays too
const overlayFilters = computed(() => searchOverlayFilters('waypoint', route.query));

// the map filters the waypoints with its extent, always: a link without one opens on a large area
watch(
  () => route.query.bbox,
  (bbox) => {
    // the page left: the watchers see the query of the next one
    if (bbox || route.name !== ROUTE_NAME) return;
    mapKey.value++;
    zoom.value = null;
    router.replace({ query: { ...route.query, bbox: $screen.isMobile ? EUROPE_BBOX : WIDE_BBOX } });
  },
  { immediate: true }
);

const zoomedIn = computed(() => zoom.value !== null && Math.round(zoom.value + 1) >= WAYPOINTS_MIN_ZOOM);
const searchQuery = computed(() => withoutDisplaySettings(route.query));
// the search, once zoomed in enough
const search = computed(() =>
  route.name === ROUTE_NAME && route.query.bbox && zoomedIn.value ? JSON.stringify(searchQuery.value) : null
);

// the waypoints shown stay until those of the next search come: the map does not blink at each move
let requested: string | null = null;
function load() {
  requested = search.value;
  if (!requested) {
    waypoints.value = [];
    total.value = 0;
    return;
  }
  const asked = requested;
  (c2c.waypoint as DocumentService)
    .getAll({ ...searchQuery.value, limit: WAYPOINTS_LIMIT, pl: $language.current })
    .then(({ data }) => {
      if (asked !== requested) return;
      waypoints.value = data.documents as C2cDocument[];
      total.value = data.total;
    });
}
watch(search, load, { immediate: true });

const hint = computed(() => {
  if (zoom.value === null) return null;
  if (!zoomedIn.value) return $gettext('Zoom in to see the waypoints');
  if (total.value > waypoints.value.length) {
    return `${$gettext('Zoom in to see all the waypoints')} (${waypoints.value.length} / ${total.value})`;
  }
  return null;
});
</script>

<style scoped>
/* the map takes the whole page, under the navigation (and above the bottom bar of the phone layout) */
:global(#app:has(.waypoints-map-view)) {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
}

:global(#app:has(.waypoints-map-view) .page-content) {
  flex: 1 1 0;
  min-height: 0;
}

.waypoints-map-view {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
}

.map-hint {
  position: absolute;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  background: var(--c2c-white);
  color: var(--c2c-text);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  font-size: 0.9rem;
  white-space: nowrap;
  /* the map stays usable under it */
  pointer-events: none;
}
</style>
