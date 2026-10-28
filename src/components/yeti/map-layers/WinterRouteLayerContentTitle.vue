<template>
  <span>
    <fa-icon icon="layer-group" />
    <span>{{ layer.title }}</span>
    <counter v-if="winterRoutesLength">{{ winterRoutesLength }}</counter>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import Counter from '@/components/yeti/Counter.vue';
import Yetix from '@/components/yeti/yetix';

defineProps({
  layer: {
    type: Object,
    required: true,
  },
});

const winterRoutes = computed(() => Yetix.winterRoutes);

const winterRoutesLength = computed(() => winterRoutes.value.length);
</script>
