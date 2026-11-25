<template>
  <span class="source-badge tag is-light" :class="`source-badge--${known ? source : 'other'}`" :title="title">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { SOURCE_LABELS, sourceLabel } from './partner-outings-map';

const props = defineProps({
  // the name of a source of the registry, or 'c2c'
  source: {
    type: String,
    required: true,
  },
  // the name of the site, e.g. from /partner-outings/sources: the label of a source the UI does not know
  siteName: {
    type: String,
    default: undefined,
  },
  // the full name of the site, shown on hover
  title: {
    type: String,
    default: undefined,
  },
});

const known = computed(() => props.source in SOURCE_LABELS);
const label = computed(() => sourceLabel(props.source, props.siteName));
</script>

<style scoped>
.source-badge {
  font-weight: bold;
  white-space: nowrap;
}

.source-badge.source-badge--c2c {
  background-color: var(--c2c-color-base-c2c);
  color: white;
}

.source-badge.source-badge--skitour {
  background-color: #d8e9f7;
  color: #1c5a8c;
}

.source-badge.source-badge--gulliver {
  background-color: #dcf1e0;
  color: #1f6a35;
}

/* the same light background and dark text in the light and the dark theme; each pair has a contrast of 5.5 or more
   (WCAG AA asks 4.5) */
.source-badge.source-badge--gipfelbuch {
  background-color: #ebe2f7;
  color: #54308a;
}

.source-badge.source-badge--bivouak {
  background-color: #fbe5cf;
  color: #8a4100;
}

.source-badge.source-badge--skitourenportal {
  background-color: #fbdde8;
  color: #8f1c48;
}

.source-badge.source-badge--other {
  background-color: #e8e8e8;
  color: #444;
}
</style>
