<template>
  <span class="source-badge tag is-light" :class="`source-badge--${known ? source : 'other'}`" :title="title">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// the short label of the sources of the registry; another source shows its name
const LABELS: Record<string, string> = {
  c2c: 'c2c',
  skitour: 'Skitour',
  gulliver: 'Gulliver',
};

const props = defineProps({
  // the name of a source of the registry, or 'c2c'
  source: {
    type: String,
    required: true,
  },
  // the full name of the site, shown on hover
  title: {
    type: String,
    default: undefined,
  },
});

const known = computed(() => props.source in LABELS);
const label = computed(() => LABELS[props.source] ?? props.source);
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

.source-badge.source-badge--other {
  background-color: #e8e8e8;
  color: #444;
}
</style>
