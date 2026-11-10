<template>
  <!-- the markup is one of the static icons of src/assets/icons-custom.ts, nothing from the network -->
  <span class="custom-icon" :style="{ width: `${size}px`, height: `${size}px` }" v-html="markup" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

import icons from '@/assets/icons-custom';

defineOptions({ name: 'CustomIcon' });

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 24 });

// an unknown name renders nothing rather than failing
const markup = computed(() =>
  (icons[props.name] ?? '')
    .replace(/(<svg[^>]*\s)width="[^"]*"/, `$1width="${props.size}"`)
    .replace(/(<svg[^>]*\s)height="[^"]*"/, `$1height="${props.size}"`)
);
</script>

<style scoped>
.custom-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}
</style>
