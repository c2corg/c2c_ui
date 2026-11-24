<template>
  <div
    v-if="showAvalancheInfo"
    class="box no-print is-relative avalanche-box"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <div class="title" v-translate>Avalanche risk</div>
    <p v-if="isOuting && regions?.length" class="is-size-7 has-text-centered has-text-grey mb-2">
      {{ $dateUtils.toLocalizedString(new Date(day + 'T12:00:00'), 'dddd DD MMMM YYYY') }}
    </p>
    <template v-if="regions?.length">
      <template v-if="hasInfo">
        <div v-if="maxLevel > 0" class="icon-bra is-flex is-justify-content-center">
          <icon-bra :size="120" :level="maxLevel" />
        </div>
        <div class="has-text-centered">
          <span v-for="(region, index) in sortedRegions" :key="region.bra.id">
            <component
              :is="officialUrl(region) ? 'a' : 'span'"
              :href="officialUrl(region)"
              :title="region.bra.fullname"
              :target="officialUrl(region) ? '_blank' : undefined"
              rel="noopener"
            >
              {{ region.bra.name }}<template v-if="region.bra.fullname"> ({{ region.bra.country }})</template>
            </component>
            <template v-if="index + 1 < sortedRegions.length">&bull; </template>
          </span>
        </div>
        <p v-if="atElevation" class="is-size-7 has-text-centered has-text-grey" :title="elevationTitle">
          <fa-icon icon="mountain" class="mr-1" />{{ elevation }} m
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
                <a href="#" @click.prevent="activeRegionId = region.regionId">{{ region.bra.name }}</a>
              </li>
            </ul>
          </div>
          <bulletin-detail
            :selected="selected(current)"
            :bulletins="current.bulletins ?? null"
            :failed="current.failed"
            embedded
            :historical="isOuting && !isToday"
            :compact="!$screen.isMobile"
            @more="fullBulletin?.show()"
          />
        </div>
      </template>
      <div v-else class="py-2">
        <p v-if="isOuting"><span v-translate key="id3">No avalanche bulletin stored for this day</span></p>
        <p v-else><span v-translate key="id2">No avalanche bulletin right now</span></p>
      </div>
      <!-- unfolded, the links follow the bulletin: no rule between them -->
      <hr v-if="!unfolded" />
      <div v-else-if="current && officialUrl(current)" class="box-link mt-3">
        <fa-icon icon="file-lines" fixed-width />
        <a :href="officialUrl(current)" target="_blank" rel="noopener">
          <span v-translate>Full bulletin</span> ({{ current.bra.name }})
        </a>
      </div>
    </template>
    <div v-if="showYeti" class="box-link">
      <icon-yeti fixed-width />
      <router-link :to="yetiUrl"><span v-translate>Use YETI to better analyze avalanche risk</span></router-link>
    </div>

    <!-- the whole bulletin, too wide for the column of the box on a large screen -->
    <modal-card v-if="current" ref="fullBulletin">
      <template #title>{{ current.bra.name }}</template>
      <bulletin-detail
        :selected="selected(current)"
        :bulletins="current.bulletins ?? null"
        :failed="current.failed"
        embedded
        :historical="isOuting && !isToday"
      />
      <template #footer>
        <a
          v-if="officialUrl(current)"
          :href="officialUrl(current)"
          target="_blank"
          rel="noopener"
          class="button is-small"
        >
          <fa-icon icon="file-lines" />
          <span class="ml-1" v-translate>Full bulletin</span>
        </a>
        <router-link v-if="showYeti" :to="yetiUrl" class="button is-small">
          <icon-yeti fixed-width />
          <span class="ml-1" v-translate>Open in YETI</span>
        </router-link>
      </template>
    </modal-card>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from 'vue';

import IconBra from '@/components/generics/icons/IconBra.vue';
import ModalCard from '@/components/generics/modals/ModalCard.vue';
import BulletinDetail from '@/components/yeti/BulletinDetail.vue';
import { dangerAtElevation } from '@/components/yeti/avalanche-bulletin';
import { type DocumentGeometry, type Region, findBulletinRegions } from '@/components/yeti/bulletin-regions';
import type { SelectedBulletin } from '@/components/yeti/yetix-types';
import avalancheBulletins from '@/js/apis/avalanche-bulletin-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty } from '@/js/properties';

const props = defineProps({ ...documentProperty });

const { $gettext, $language } = useGlobalProperties();

const isOuting = computed(() => props.document.type === 'o');
// the day of an outing (when it lasts several, the first): its bulletins, not the latest ones
const day = computed<string>(() => props.document.date_start as string);
const isToday = computed(() => day.value === new Date().toISOString().slice(0, 10));

const regions = ref<Region[] | null>(null);

// the danger is the one at the highest point of the route (of the outing, else of its routes), once its bulletin is
// there
const elevation = computed<number | undefined>(() => {
  if (props.document.elevation_max) return props.document.elevation_max;
  const routes = (isOuting.value ? props.document.associations?.routes : []) as { elevation_max?: number }[];
  return Math.max(0, ...routes.map((route) => route.elevation_max ?? 0)) || undefined;
});
const elevationTitle = computed(() =>
  isOuting.value
    ? $gettext('Danger at the highest point of the outing')
    : $gettext('Danger at the highest point of the route')
);
const regionBulletin = (region: Region) => region.bulletins?.[0];
const dangerOf = (region: Region) => {
  const bulletin = regionBulletin(region);
  // the summary of the zones is the one of today: not for the day of an outing
  const summary = isOuting.value ? undefined : region.bra.danger.max;
  return (bulletin && dangerAtElevation(bulletin.dangerRatings, elevation.value)) ?? summary ?? 0;
};
// the most dangerous first
const sortedRegions = computed(() => [...(regions.value ?? [])].sort((a, b) => dangerOf(b) - dangerOf(a)));
const maxLevel = computed(() => Math.max(0, ...sortedRegions.value.map(dangerOf)));
const atElevation = computed(() => !!elevation.value && sortedRegions.value.some(regionBulletin));
const withBulletins = computed(() => sortedRegions.value.filter((region) => region.regionId));
// the bulletins of an outing are not asked yet: not "no bulletin" for now
const pending = computed(() => isOuting.value && withBulletins.value.some((region) => region.bulletins === undefined));
// a danger, or a bulletin of the API (being fetched, failed or there) though the summary has no danger
const hasInfo = computed(
  () =>
    maxLevel.value > 0 ||
    pending.value ||
    withBulletins.value.some((region) => region.bulletins !== undefined && (region.bulletins?.length ?? 1) > 0)
);

const activeRegionId = ref<string | null>(null);
const current = computed(
  () => withBulletins.value.find((region) => region.regionId === activeRegionId.value) ?? withBulletins.value[0]
);
const selected = (region: Region): SelectedBulletin => ({ regionId: region.regionId!, name: region.bra.name });

// the PDF of Météo-France, else the website of the service, else the link of the zone (not the ENSG page of the
// French massifs, which goes away)
function officialUrl(region: Region) {
  // the PDF and the pages of the services are the ones of today
  if (isOuting.value && !isToday.value) return undefined;
  if (region.regionId?.startsWith('FR-')) return avalancheBulletins.pdfUrl(region.regionId);
  const website = regionBulletin(region)?.source?.provider?.website;
  const zoneUrl = region.bra.urls[0]?.url;
  return website ?? (zoneUrl && !zoneUrl.includes('showbra.php') ? zoneUrl : undefined);
}

// YETI shows the latest bulletin: not for the day of an outing in the past
const showYeti = computed(() => !isOuting.value || isToday.value);

// YETI on the route (not on an outing), its bulletin tab on the most dangerous region
const yetiUrl = computed(() => ({
  name: 'yeti',
  params: isOuting.value ? {} : { document_id: props.document.document_id },
  query: withBulletins.value.length ? { bulletin: withBulletins.value[0].regionId } : {},
}));

const showAvalancheInfo = computed(() => {
  if (props.document?.type !== 'r' && !(props.document?.type === 'o' && props.document.date_start)) {
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
watch(unfolded, (open) => open && fetchBulletins());
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

// once: when the browser is idle, or earlier when the box is opened before
let fetchStarted = false;
function fetchBulletins() {
  if (fetchStarted) return;
  fetchStarted = true;
  for (const region of regions.value ?? []) {
    if (!region.regionId) continue;
    region.bulletins = null;
    (isOuting.value
      ? avalancheBulletins.getBulletinsOfDay(region.regionId, day.value, $language.current, aborter.signal)
      : avalancheBulletins.getLatestBulletins(region.regionId, $language.current, aborter.signal)
    )
      .then((bulletins) => (region.bulletins = bulletins))
      .catch(() => {
        if (!aborter.signal.aborted) region.failed = true;
      });
  }
}

// the geometry of the document, else (an outing with none) the ones of its routes
function geometries(): DocumentGeometry[] {
  const { geometry, associations } = props.document;
  if (geometry?.geom || geometry?.geom_detail || !isOuting.value) return [geometry];
  return (associations?.routes ?? []).map((route: { geometry?: DocumentGeometry }) => route.geometry);
}

onMounted(async () => {
  if (!showAvalancheInfo.value) return;
  const found = await findBulletinRegions(geometries());
  // the day of an outing: the regions with a bulletin to look for
  regions.value = isOuting.value ? found.filter((region) => region.regionId) : found;
  if (regions.value.length) whenIdle(fetchBulletins);
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

/* the official bulletin and YETI: the two ways further, alike */
.box-link {
  font-size: 1.05rem;
}

.box-link + .box-link {
  margin-top: 0.25rem;
}
</style>
