<template>
  <component
    :is="disabled ? 'span' : 'router-link'"
    :to="{ name: 'associations-history', query: query }"
    rel="nofollow"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  documentId: {
    type: Number,
    default: null,
  },
  userId: {
    type: Number,
    default: null,
  },
  limit: {
    type: Number,
    default: null,
  },
  offset: {
    type: Number,
    default: null,
  },
});

const query = computed(() => {
  const result: Record<string, number> = {};

  if (props.offset) {
    result.offset = props.offset;
  }

  if (props.limit) {
    result.limit = props.limit;
  }

  if (props.documentId) {
    result.d = props.documentId;
  }

  if (props.userId) {
    result.u = props.userId;
  }

  return result;
});
</script>
