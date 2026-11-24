<template>
  <component
    :is="isPartner ? 'a' : 'router-link'"
    v-bind="linkProps"
    class="partner-outing-row has-text-normal is-flex has-hover-background"
  >
    <activities :activities="outing.activities" class="is-size-3 activity-icons" />
    <span class="partner-outing-main">
      <span class="outing-title has-text-weight-bold">{{ outing.title }}</span>
      <span v-if="rating" class="outing-rating"> &bull; {{ rating }}</span>
      <span v-if="area" class="is-size-7 is-italic outing-area">{{ area.title }}</span>
      <span class="is-size-7 outing-credit">{{ credit }}</span>
    </span>
    <span class="outing-side">
      <source-badge :source="outing.source" :title="outing.credit.site" />
      <fa-icon v-if="isPartner" icon="external-link-alt" class="external-icon" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';

import SourceBadge from './SourceBadge.vue';

import type { PartnerOuting } from '@/js/apis/partner-outings-service';
import { useGlobalProperties } from '@/js/composables/global-properties';

const props = defineProps({
  outing: {
    type: Object as PropType<PartnerOuting>,
    required: true,
  },
});

const { $gettext } = useGlobalProperties();

// the outings of c2c stay in the site, the others open the page of the partner site in a new tab
const isPartner = computed(() => props.outing.source !== 'c2c' && !!props.outing.url);

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
const credit = computed(() =>
  $gettext('By {author} on {site}')
    .replace('{author}', props.outing.author?.name ?? site.value)
    .replace('{site}', site.value)
);
</script>

<style scoped>
.partner-outing-row {
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

.outing-credit {
  flex-basis: 100%;
  color: var(--c2c-grey-light);
}

.outing-side {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.external-icon {
  color: var(--c2c-grey-light);
}
</style>
