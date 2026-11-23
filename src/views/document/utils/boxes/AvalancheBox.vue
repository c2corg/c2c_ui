<template>
  <div
    v-if="showAvalancheInfo"
    class="box no-print is-relative avalanche-box"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <div class="title" v-translate>Avalanche risk</div>
    <template v-if="regions?.length">
      <template v-if="hasInfo">
        <div class="icon-bra is-flex is-justify-content-center">
          <icon-bra :size="120" :level="maxLevel" />
        </div>
        <div class="has-text-centered">
          <span v-for="(region, index) in sortedRegions" :key="region.bra.id">
            <a :href="officialUrl(region)" :title="region.bra.fullname" target="_blank" rel="noopener">
              {{ region.bra.name }}<template v-if="region.bra.fullname"> ({{ region.bra.country }})</template>
            </a>
            <template v-if="index + 1 < sortedRegions.length">&bull; </template>
          </span>
        </div>
        <p v-if="atElevation" class="is-size-7 has-text-centered has-text-grey">
          {{ $gettext('Danger at the highest point of the route') }} ({{ elevation }} m)
        </p>

        <!-- the full bulletin, unfolded in the box: by this button (touch, keyboard), or by a long hover -->
        <button
          v-if="withBulletins.length"
          type="button"
          class="button is-white is-small is-fullwidth bulletin-toggle"
          :aria-expanded="unfolded"
          :aria-controls="panelId"
          @click="onToggleClick"
        >
          <span v-translate>Avalanche bulletin</span>
          <fa-icon :icon="unfolded ? 'angle-up' : 'angle-down'" class="ml-1" />
        </button>
        <div v-if="unfolded && current" :id="panelId" class="bulletin-panel">
          <div v-if="withBulletins.length > 1" class="tabs is-small is-centered mb-2">
            <ul>
              <li v-for="region of withBulletins" :key="region.regionId!" :class="{ 'is-active': region === current }">
                <a @click="activeRegionId = region.regionId">{{ region.bra.name }}</a>
              </li>
            </ul>
          </div>
          <bulletin-detail
            :selected="selected(current)"
            :bulletins="current.bulletins"
            :failed="current.failed"
            embedded
            :compact="!$screen.isMobile"
            @more="fullBulletin?.show()"
          />
        </div>
      </template>
      <div v-else class="py-2">
        <p><span v-translate key="id2">No avalanche bulletin right now</span></p>
      </div>
      <hr />
    </template>
    <div>
      <icon-yeti fixed-width />
      <router-link :to="yetiUrl"><span v-translate>Use YETI to better analyze avalanche risk</span></router-link>
    </div>

    <!-- the whole bulletin, too wide for the column of the box on a large screen -->
    <modal-card v-if="current" ref="fullBulletin">
      <template #title>{{ current.bra.name }}</template>
      <bulletin-detail :selected="selected(current)" :bulletins="current.bulletins" :failed="current.failed" embedded />
      <template #footer>
        <router-link :to="yetiUrl" class="button is-small">
          <icon-yeti fixed-width />
          <span class="ml-1" v-translate>Open in YETI</span>
        </router-link>
      </template>
    </modal-card>
  </div>
</template>
<script setup lang="ts">
import { booleanIntersects as turfBooleanIntersects } from '@turf/boolean-intersects';
import { buffer as turfBuffer } from '@turf/buffer';
import { simplify as turfSimplify } from '@turf/simplify';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue';

import IconBra from '@/components/generics/icons/IconBra.vue';
import ModalCard from '@/components/generics/modals/ModalCard.vue';
import BulletinDetail from '@/components/yeti/BulletinDetail.vue';
import { bulletinRegionId, dangerAtElevation } from '@/components/yeti/avalanche-bulletin';
import type { SelectedBulletin } from '@/components/yeti/yetix-types';
import avalancheBulletins, { type AvalancheBulletin } from '@/js/apis/avalanche-bulletin-service';
import yetiService from '@/js/apis/yeti-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty } from '@/js/properties';

const props = defineProps({ ...documentProperty });

const { $language } = useGlobalProperties();

// a zone of the avalanche bulletins (BRA), and its bulletin
type Zone = Feature<Polygon | MultiPolygon, { name: string; country: string; numZone?: string | null }>;
type Bra = {
  id: string;
  name: string;
  fullname?: string;
  country: string;
  zone: string;
  urls: { url: string }[];
  danger: { max: number | null };
  orientations: Record<string, unknown>;
  validUntil: string;
};
// a zone of the route, its EAWS region (none when the c2c API has no bulletin for it) and the bulletins of the API:
// undefined until asked, null while fetched
type Region = { bra: Bra; regionId: string | null; bulletins?: AvalancheBulletin[] | null; failed: boolean };

const regions = ref<Region[] | null>(null);

// the danger is the one at the highest point of the route, once its bulletin is there
const elevation = computed(() => props.document.elevation_max as number | null | undefined);
const regionBulletin = (region: Region) => region.bulletins?.[0];
const dangerOf = (region: Region) => {
  const bulletin = regionBulletin(region);
  return (bulletin && dangerAtElevation(bulletin.dangerRatings, elevation.value)) ?? region.bra.danger.max ?? 0;
};
// the most dangerous first
const sortedRegions = computed(() => [...(regions.value ?? [])].sort((a, b) => dangerOf(b) - dangerOf(a)));
const maxLevel = computed(() => Math.max(0, ...sortedRegions.value.map(dangerOf)));
const hasInfo = computed(() => maxLevel.value > 0);
const atElevation = computed(() => !!elevation.value && sortedRegions.value.some(regionBulletin));
const withBulletins = computed(() => sortedRegions.value.filter((region) => region.regionId));

const activeRegionId = ref<string | null>(null);
const current = computed(
  () => withBulletins.value.find((region) => region.regionId === activeRegionId.value) ?? withBulletins.value[0]
);
const selected = (region: Region): SelectedBulletin => ({ regionId: region.regionId!, name: region.bra.name });

// the PDF of Météo-France, else the website of the service, else the link of the zone (not the ENSG page of the
// French massifs, which goes away)
function officialUrl(region: Region) {
  if (region.regionId?.startsWith('FR-')) return avalancheBulletins.pdfUrl(region.regionId);
  const website = regionBulletin(region)?.source?.provider?.website;
  const zoneUrl = region.bra.urls[0]?.url;
  return website ?? (zoneUrl && !zoneUrl.includes('showbra.php') ? zoneUrl : undefined);
}

// YETI on the route, its bulletin tab on the most dangerous region
const yetiUrl = computed(() => ({
  name: 'yeti',
  params: { document_id: props.document.document_id },
  query: withBulletins.value.length ? { bulletin: withBulletins.value[0].regionId } : {},
}));

const showAvalancheInfo = computed(() => {
  if (props.document?.type !== 'r') {
    return false;
  }

  const activities = ['skitouring', 'snow_ice_mixed', 'ice_climbing', 'snowshoeing'];

  return props.document.activities?.some((activity: string) => activities.includes(activity));
});

// --- unfolding: a long hover (cancelled when the pointer leaves before), folded a moment after it leaves; a click
// pins it open, a second one folds it ---

const HOVER_DELAY = 600;
const LEAVE_DELAY = 400;
const panelId = useId();
const fullBulletin = useTemplateRef<InstanceType<typeof ModalCard>>('fullBulletin');
const pinned = ref(false);
const hovered = ref(false);
const unfolded = computed(() => pinned.value || hovered.value);
let hoverTimer: ReturnType<typeof setTimeout> | undefined;

function onPointerEnter(event: PointerEvent) {
  clearTimeout(hoverTimer);
  // touch has no hover: the button
  if (event.pointerType !== 'mouse' || !withBulletins.value.length) return;
  if (!hovered.value) hoverTimer = setTimeout(() => (hovered.value = true), HOVER_DELAY);
}

function onPointerLeave() {
  clearTimeout(hoverTimer);
  if (hovered.value) hoverTimer = setTimeout(() => (hovered.value = false), LEAVE_DELAY);
}

function onToggleClick() {
  clearTimeout(hoverTimer);
  // unfolded by the hover: the click keeps it open
  pinned.value = hovered.value && !pinned.value ? true : !pinned.value;
  hovered.value = false;
}

// --- the bulletins, fetched in the background once the regions are known: there when the box unfolds ---

const aborter = new AbortController();
onBeforeUnmount(() => {
  aborter.abort();
  clearTimeout(hoverTimer);
});

function whenIdle(callback: () => void) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(callback, { timeout: 2000 });
  else setTimeout(callback, 200);
}

function fetchBulletins() {
  for (const region of regions.value ?? []) {
    if (!region.regionId) continue;
    region.bulletins = null;
    avalancheBulletins
      .getLatestBulletins(region.regionId, $language.current, aborter.signal)
      .then((bulletins) => (region.bulletins = bulletins))
      .catch(() => {
        if (!aborter.signal.aborted) region.failed = true;
      });
  }
}

onMounted(() => {
  if (showAvalancheInfo.value) {
    const geometry = props.document.geometry!;
    // OpenLayers' GeoJSON format (reprojection) loaded with the zones, not in the startup bundle (#4876)
    Promise.all([yetiService.zonesBra(), import('ol/format/GeoJSON')]).then(
      ([response, { default: GeoJSONFormat }]: [
        { data: FeatureCollection<Polygon | MultiPolygon, Zone['properties']> },
        typeof import('ol/format/GeoJSON'),
      ]) => {
        const GeoJSON = new GeoJSONFormat();
        // use WGS 84 projection for buffering with turf
        const routeGeometry = (
          turfBuffer(
            turfSimplify(
              GeoJSON.writeGeometryObject(
                GeoJSON.readGeometry(JSON.parse((geometry.geom_detail ?? geometry.geom)!), {
                  dataProjection: 'EPSG:3857',
                  featureProjection: 'EPSG:4326',
                })!
              ) as Geometry,
              { tolerance: 0.01, highQuality: false }
            ),
            geometry.geom_detail ? 1 : 2,
            {
              units: 'kilometers',
            }
          ) as Feature<Polygon | MultiPolygon>
        ).geometry;

        const zones = response.data.features.filter((feature) =>
          turfBooleanIntersects(turfBuffer(feature.geometry, 0.001, { units: 'kilometers' })!.geometry, routeGeometry)
        );

        if (zones.length) {
          const m = new Map(zones.map((zone) => [zone.properties.name + '@' + zone.properties.country, zone]));
          yetiService.bra().then((response: { data: { zones: Bra[] } }) => {
            regions.value = response.data.zones
              .filter((zone) => m.has(zone.zone + '@' + zone.country))
              .map((zone) => {
                const feature = m.get(zone.zone + '@' + zone.country)!;
                return {
                  bra: { ...feature.properties, ...zone },
                  regionId: bulletinRegionId({
                    ...feature.properties,
                    contains: (lonLat) =>
                      turfBooleanIntersects({ type: 'Point', coordinates: lonLat }, feature.geometry),
                  }),
                  failed: false,
                };
              });
            whenIdle(fetchBulletins);
          });
        }
      }
    );
  }
});
</script>
<style scoped>
@import '@/assets/css/media.css';

.icon-bra {
  margin: -35px 0 -25px 0;
}

.bulletin-toggle {
  margin-top: 0.5rem;
}

.bulletin-panel {
  margin-top: 0.5rem;
}

/* in the column of a large screen: its own scroll, the page does not jump */
@media screen and (--c2c-min-tablet) {
  .bulletin-panel {
    max-height: 70vh;
    overflow-y: auto;
  }
}
</style>
