<template>
  <div class="partner-outings-map" data-test="map">
    <div ref="mapElement" class="map-canvas" />

    <p v-if="unsupported" class="notification is-warning is-light map-unsupported" data-test="map-unsupported">
      {{ $gettext('The map needs WebGL, which this browser does not offer') }}
    </p>

    <div class="map-filter">
      <input
        id="partner-outings-filter-extent"
        class="switch is-rtl is-rounded is-info is-small"
        type="checkbox"
        data-test="filter-extent"
        :checked="filterByExtent"
        @change="emit('update:filterByExtent', ($event.target as HTMLInputElement).checked)"
      />
      <label
        for="partner-outings-filter-extent"
        v-translate
        :title="filterByExtent ? $gettext('Map filter on') : $gettext('Map filter off')"
      >
        Filter on map extent
      </label>
    </div>

    <ul class="map-legend is-size-7" data-test="legend">
      <li v-for="source of sourcesShown" :key="source">
        <span class="legend-dot" :style="{ backgroundColor: sourceColor(source) }" />
        {{ sourceLabel(source) }}
      </li>
      <li v-if="hasApproximate" data-test="legend-approximate">
        <span class="legend-dot is-approximate" />
        {{ $gettext('Approximate location') }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// The map of the outings: a MapLibre map (as the lists of documents, C2cMap.vue) with one marker per outing. Kept to
// what the list needs and apart from the rest of the page: the markers go in, the hover, the click and the extent come
// out, so that its inside follows the MapLibre migration without the page noticing.
import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { computed, onBeforeUnmount, onMounted, type PropType, ref, useTemplateRef, watch } from 'vue';

import { type OutingMarker, bboxParam, sourceColor } from './partner-outings-map';

import { getDocumentIcon } from '@/components/map/map-documents';
import { baseLayers, rasterSource } from '@/components/map/map-layers';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { extentFromLonLat, extentToLonLat } from '@/js/geo/projection';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

setWorkerUrl(workerUrl);

const props = defineProps({
  markers: {
    type: Array as PropType<OutingMarker[]>,
    default: () => [],
  },
  // the id of the outing under the pointer in the list (or on the map)
  highlightedId: {
    type: String as PropType<string | null>,
    default: null,
  },
  // the outings are those of the extent of the map: it is not moved to show them
  filterByExtent: {
    type: Boolean,
    default: false,
  },
  // the extent to show first, in EPSG:3857
  initialExtent: {
    type: Array as PropType<number[] | null>,
    default: null,
  },
});

const emit = defineEmits<{
  highlight: [id: string | null];
  select: [id: string];
  // the extent of the map in EPSG:3857, after the user moved it
  'extent-change': [extent: number[]];
  'update:filterByExtent': [value: boolean];
}>();

const { $gettext } = useGlobalProperties();

const mapElement = useTemplateRef<HTMLElement>('mapElement');
const unsupported = ref(false);

// not reactive: Vue proxies break the objects of the map library
let map: MapLibreMap | null = null;
let drawn: { marker: Marker; element: HTMLElement; id: string }[] = [];

const LABELS: Record<string, string> = { c2c: 'camptocamp.org', skitour: 'Skitour', gulliver: 'Gulliver' };
const sourceLabel = (source: string) => LABELS[source] ?? source;
const sourcesShown = computed(() => [...new Set(props.markers.map((m) => m.outing.source))].sort());
const hasApproximate = computed(() => props.markers.some((m) => m.approximate));

// the outing icon of the maps of the site, for the outings of c2c
const c2cIcon = () => getDocumentIcon({ type: 'o' } as C2cDocument)?.svgSrc;

function markerElement({ outing, approximate }: OutingMarker) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'outing-marker';
  element.classList.add(`outing-marker--${outing.source === 'c2c' ? 'c2c' : 'partner'}`);
  element.classList.toggle('is-approximate', approximate);
  element.dataset.outingId = outing.id;
  element.dataset.source = outing.source;
  element.dataset.approximate = String(approximate);
  const title = approximate ? `${outing.title} (${$gettext('approximate location')})` : outing.title;
  element.title = title;
  element.setAttribute('aria-label', title);
  const dot = document.createElement('span');
  dot.className = 'outing-marker-dot';
  dot.style.setProperty('--marker-color', sourceColor(outing.source));
  const icon = outing.source === 'c2c' ? c2cIcon() : null;
  if (icon) {
    const image = document.createElement('img');
    image.src = icon;
    image.alt = '';
    dot.append(image);
  }
  element.append(dot);
  element.addEventListener('mouseenter', () => emit('highlight', outing.id));
  element.addEventListener('mouseleave', () => emit('highlight', null));
  element.addEventListener('click', () => emit('select', outing.id));
  return element;
}

function drawMarkers() {
  drawn.forEach(({ marker }) => marker.remove());
  drawn = [];
  if (!map) return;
  for (const item of props.markers) {
    const element = markerElement(item);
    const marker = new Marker({ element }).setLngLat(item.position).addTo(map);
    drawn.push({ marker, element, id: item.outing.id });
  }
  showHighlight();
}

function showHighlight() {
  for (const { element, id } of drawn) {
    element.classList.toggle('is-highlighted', id === props.highlightedId);
  }
}

// every marker in view; a lone one is not zoomed on
function fitMarkers() {
  if (!map || props.markers.length === 0) return;
  const bounds = new LngLatBounds();
  props.markers.forEach((m) => bounds.extend(m.position));
  map.fitBounds(bounds, { padding: 48, maxZoom: 11, duration: 0 });
}

/** The extent of the map in EPSG:3857, the metre */
function extent() {
  const bounds = map!.getBounds();
  return bboxParam(extentFromLonLat([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]));
}

// the map follows its container when the page shows it (it was hidden) or resizes it
function resize() {
  map?.resize();
}
defineExpose({ resize, extent: () => (map ? extent() : null) });

onMounted(() => {
  try {
    map = new MapLibreMap({
      container: mapElement.value!,
      style: {
        version: 8,
        sources: { base: rasterSource(baseLayers[0]) },
        layers: [{ id: 'base', type: 'raster', source: 'base' }],
      },
      center: [6.5, 45.8],
      zoom: 6,
      attributionControl: { compact: true },
    });
  } catch {
    unsupported.value = true;
    return;
  }
  map.addControl(new NavigationControl({ showCompass: false }), 'top-left');
  map.once('load', () => {
    if (props.initialExtent) {
      map!.fitBounds(extentToLonLat(props.initialExtent) as [number, number, number, number], { duration: 0 });
    } else if (!props.filterByExtent) {
      fitMarkers();
    }
  });
  // only the moves of the user (they have an original event) filter the outings: not the ones the page makes
  map.on('moveend', (event: { originalEvent?: unknown }) => {
    if (event.originalEvent && props.filterByExtent) emit('extent-change', extent());
  });
  drawMarkers();
});

onBeforeUnmount(() => {
  drawn.forEach(({ marker }) => marker.remove());
  map?.remove();
  map = null;
});

watch(
  () => props.markers,
  () => {
    drawMarkers();
    // an extent that filters is the user's: the map stays where it is
    if (!props.filterByExtent) fitMarkers();
  }
);
watch(() => props.highlightedId, showHighlight);
watch(
  () => props.filterByExtent,
  (on) => {
    // turned on: the outings of the extent of the map as it is
    if (map && on) emit('extent-change', extent());
  }
);
</script>

<style scoped>
.partner-outings-map {
  position: relative;
  height: 100%;
  min-height: 20rem;
}

.map-canvas {
  position: absolute;
  inset: 0;
}

.map-unsupported {
  position: absolute;
  top: 3rem;
  left: 0.5rem;
  right: 0.5rem;
  z-index: 2;
}

.map-filter,
.map-legend {
  position: absolute;
  z-index: 2;
  background-color: rgb(255 255 255 / 90%);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  color: #363636;
}

.map-filter {
  top: 0.5rem;
  right: 0.5rem;
}

.map-legend {
  bottom: 1.5rem;
  left: 0.5rem;
  list-style: none;
}

.legend-dot {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  vertical-align: middle;
  margin-right: 0.25rem;
  border: 2px solid white;
  box-shadow: 0 0 0 1px rgb(0 0 0 / 40%);
}

/* the place is only roughly known: lighter, with a dashed outline */
.legend-dot.is-approximate {
  background-color: rgb(255 255 255 / 70%);
  border: 2px dashed #555;
  box-shadow: none;
}
</style>

<!-- the markers are added to the map by the library, out of the scope of this component -->
<style>
.outing-marker {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.outing-marker-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background-color: var(--marker-color);
  border: 2px solid white;
  box-shadow: 0 0 2px 1px rgb(0 0 0 / 50%);
  transition: transform 0.1s;
}

.outing-marker--c2c .outing-marker-dot {
  width: 1.5rem;
  height: 1.5rem;
}

.outing-marker--c2c img {
  width: 0.9rem;
  height: 0.9rem;
}

/* approximate: the colour lightened, with a dashed outline of it */
.outing-marker.is-approximate .outing-marker-dot {
  background-color: color-mix(in srgb, var(--marker-color) 30%, white);
  border: 2px dashed var(--marker-color);
  box-shadow: none;
}

.outing-marker.is-highlighted {
  z-index: 1;
}

.outing-marker.is-highlighted .outing-marker-dot {
  transform: scale(1.5);
  border-color: #e00;
}
</style>
