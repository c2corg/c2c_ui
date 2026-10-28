<template>
  <router-link target="_blank" :to="path" rel="nofollow">
    <button v-if="display === 'button'" class="button is-primary is-size-7-mobile">
      <fa-icon icon="print"></fa-icon>
      <span>&nbsp;</span>
      <span v-translate>Print search results</span>
    </button>
    <span v-else class="dropdown-item">
      <fa-icon icon="print"></fa-icon>
      <span v-translate>Print search results</span>
    </span>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useUrlFilters } from '@/js/composables/url-filters';

defineProps({
  display: {
    type: String,
    default: 'button',
  },
});

const route = useRoute();

const { documentType } = useUrlFilters();

const path = computed(() => ({ path: documentType.value + 's/print', query: route.query }));
</script>
