<template>
  <!-- the page shows the full content of the listed results (the current page of the list, with its query): to read
    them one after the other, or to print them -->
  <router-link
    target="_blank"
    :to="path"
    rel="nofollow"
    :title="$gettext('Show the full content of the listed results, one after the other (to read or print)')"
  >
    <button v-if="display === 'button'" class="button is-primary is-size-7-mobile">
      <fa-icon icon="book-open"></fa-icon>
      <span class="is-hidden-touch">&nbsp;</span>
      <span class="is-hidden-touch" v-translate>Full view</span>
    </button>
    <span v-else class="dropdown-item">
      <fa-icon icon="book-open"></fa-icon>
      <span v-translate>Full view</span>
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
