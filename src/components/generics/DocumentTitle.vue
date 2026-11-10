<template>
  <span>
    <span v-if="uppercaseFirstLetter">{{ $filters.uppercaseFirstLetter(title) }}</span>
    <span v-else>{{ title }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  uppercaseFirstLetter: {
    type: Boolean,
    default: false,
  },
});

const { $documentUtils } = useGlobalProperties();
const route = useRoute();

const title = computed(() => $documentUtils.getDocumentTitle(props.document, route.params.lang as string));
</script>
