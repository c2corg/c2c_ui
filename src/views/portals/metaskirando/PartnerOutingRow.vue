<template>
  <!-- the row: its link takes the whole row but the GPX link, a sibling of it (a link cannot hold another) -->
  <div class="partner-outing-row is-flex has-hover-background">
    <component
      :is="isPartner ? 'a' : 'router-link'"
      v-bind="linkProps"
      class="partner-outing-link has-text-normal is-flex"
      data-test="outing-link"
    >
      <activities :activities="outing.activities" class="is-size-3 activity-icons" />
      <span class="partner-outing-main">
        <span v-if="isNew" class="tag is-warning is-light outing-new" data-test="new">{{ $gettext('New') }}</span>
        <!-- e.g. the date, where the rows are not grouped by date -->
        <slot name="before-title" />
        <span class="outing-title has-text-weight-bold">{{ outing.title }}</span>
        <span v-if="rating" class="outing-rating"> &bull; {{ rating }}</span>
        <span v-if="area" class="is-size-7 is-italic outing-area">{{ area.title }}</span>
        <fa-icon
          v-if="approximate"
          icon="map-marker-alt"
          class="is-size-7 outing-approximate"
          data-test="approximate"
          :title="$gettext('Approximate location')"
        />
        <!-- e.g. the distance to the document of the page -->
        <slot />
        <span class="is-size-7 outing-credit">{{ credit }}</span>
      </span>
      <span class="outing-side">
        <fa-icon
          v-if="outing.has_track"
          icon="route"
          class="is-size-7 track-icon"
          data-test="track"
          :title="$gettext('Track shown on the map')"
        />
        <source-badge :source="outing.source" :title="outing.credit.site" :site-name="outing.credit.site" />
        <fa-icon v-if="isPartner" icon="external-link-alt" class="external-icon" />
      </span>
    </component>
    <a
      v-if="gpxUrl"
      :href="gpxUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="gpx-link is-size-7"
      data-test="gpx"
      :title="$gettext('GPX track')"
    >
      <fa-icon icon="download" />
      GPX
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';

import SourceBadge from './SourceBadge.vue';
import { isApproximate } from './partner-outings-map';

import type { PartnerOuting } from '@/js/apis/partner-outings-service';
import { useGlobalProperties } from '@/js/composables/global-properties';

const props = defineProps({
  outing: {
    type: Object as PropType<PartnerOuting>,
    required: true,
  },
  // no source showed it at its previous visit
  isNew: {
    type: Boolean,
    default: false,
  },
});

const { $gettext } = useGlobalProperties();

// the outings of c2c stay in the site, the others open the page of the partner site in a new tab
const isPartner = computed(() => props.outing.source !== 'c2c' && !!props.outing.url);

// the position of the outing is the summit or the middle of its area, not where it started
const approximate = computed(() => isApproximate(props.outing));

// the GPX file of the track, only from an https URL; it opens in a new tab, without opening the row's link
const gpxUrl = computed(() => {
  const url = props.outing.gpx_url;
  return url && /^https:\/\/[^\s]+$/i.test(url) ? url : null;
});

const site = computed(() => props.outing.credit.site);

const linkProps = computed(() =>
  isPartner.value
    ? {
        href: props.outing.url,
        target: '_blank',
        rel: 'noopener external',
        title: $gettext('Open on {site}').replace('{site}', site.value),
      }
    : { to: { name: 'outing', params: { id: props.outing.document_id } } }
);

// the rating as the source writes it, else the range of ski ratings
const rating = computed(() => {
  const { rating } = props.outing;
  if (!rating) {
    return null;
  }
  if (rating.raw) {
    return rating.raw;
  }
  const { ski_rating_min: min, ski_rating_max: max } = rating;
  if (min && max && min !== max) {
    return `${min}–${max}`;
  }
  return min ?? max ?? null;
});

// the first mountain range, else the first area
const area = computed(() => props.outing.areas.find((a) => a.area_type === 'range') ?? props.outing.areas[0]);

// the licence of the sources asks for the credit on every row
const credit = computed(() => {
  const author = props.outing.author?.name;
  return author
    ? $gettext('By {author} on {site}').replace('{author}', author).replace('{site}', site.value)
    : $gettext('On {site}').replace('{site}', site.value);
});
</script>

<style scoped>
.partner-outing-row {
  align-items: center;
  gap: 0.5em;
}

.partner-outing-link {
  flex-grow: 1;
  min-width: 0;
  align-items: center;
  padding: 4px 0;
}

.activity-icons {
  line-height: 1;
  display: flex;
  flex-wrap: nowrap;
}

.partner-outing-main {
  flex-grow: 1;
  padding-left: 3px;
  padding-right: 3px;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.4em;
}

.outing-area:before {
  content: '\2022\00a0';
}

.outing-approximate {
  color: var(--c2c-grey-light);
}

.outing-credit {
  flex-basis: 100%;
  color: var(--c2c-grey-light);
}

.outing-side {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.gpx-link {
  white-space: nowrap;
  color: var(--c2c-grey-light);
}

.gpx-link:hover {
  color: var(--c2c-primary);
}

.track-icon,
.external-icon {
  color: var(--c2c-grey-light);
}
</style>
