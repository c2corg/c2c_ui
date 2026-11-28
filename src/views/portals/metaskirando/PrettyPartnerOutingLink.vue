<template>
  <!-- the line of a c2c outing in the boxes of the documents (PrettyOutingLink), the site of the outing at the end -->
  <component
    :is="outing.url ? 'a' : 'span'"
    :href="outing.url ?? undefined"
    :target="outing.url ? '_blank' : undefined"
    :rel="outing.url ? 'noopener external' : undefined"
    :title="$gettext('Open on {site}').replace('{site}', outing.credit.site)"
    class="pretty-partner-outing-link has-hover-background"
    data-test="partner-outing"
  >
    <span class="has-text-normal">
      {{ outing.date }}
      &hairsp;&bull;&hairsp;
    </span>
    <span>{{ outing.title }}</span>
    <span class="has-text-normal">
      <activities :activities="outing.activities" class="is-size-4 has-text-secondary icon-activities" />
      <!-- the licence of the sources asks for the author and the site on every line -->
      <template v-if="outing.author?.name">
        &hairsp;&bull;&hairsp;
        {{ outing.author.name }}
      </template>
      &hairsp;&bull;&hairsp;
      <source-badge :source="outing.source" :title="outing.credit.site" :site-name="outing.credit.site" />
    </span>
  </component>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import SourceBadge from './SourceBadge.vue';

import type { PartnerOuting } from '@/js/apis/partner-outings-service';

defineProps({
  outing: {
    type: Object as PropType<PartnerOuting>,
    required: true,
  },
});
</script>

<style scoped>
.pretty-partner-outing-link {
  display: block;
  line-height: 1.4rem;
}

/* as small as the markers of a c2c outing line */
.pretty-partner-outing-link :deep(.source-badge) {
  height: 1.4em;
  padding: 0 0.5em;
  font-size: 0.7rem;
  vertical-align: text-bottom;
}
</style>
