<template>
  <div>
    <div v-if="!promise.data && !promise.error" class="notification is-primary">Loading</div>

    <not-found v-else-if="isNotFound" />

    <div v-else-if="promise.error" class="notification is-danger">
      {{ promise.error.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';

import NotFound from '@/views/static-views/NotFoundView.vue';

const props = defineProps({
  promise: {
    type: [Object, Promise] as PropType<{
      data?: unknown;
      error?: { message?: string; response?: { status?: number } };
    }>,
    required: true,
  },
});

// not "notFound": <not-found> would resolve to it, not to the component
const isNotFound = computed(() => Boolean(props.promise?.error?.response?.status === 404));
</script>
