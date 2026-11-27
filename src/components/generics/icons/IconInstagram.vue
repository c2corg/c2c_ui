<template>
  <span class="instagram" :style="{ '--instagram-fill': `url(#${gradientId})` }">
    <!-- hack to be able to apply gradient on font awesome 5 icons: https://stackoverflow.com/questions/47800574/gradient-over-instagram-svg-of-fontawesome-5
         one gradient per icon: a gradient inside a hidden copy of the icon (the side menu, hidden in the phone layout) paints nothing -->
    <svg class="gradient" width="0" height="0" aria-hidden="true" focusable="false">
      <radialGradient :id="gradientId" r="150%" cx="30%" cy="107%">
        <stop stop-color="#fdf497" offset="0" />
        <stop stop-color="#fdf497" offset="0.05" />
        <stop stop-color="#fd5949" offset="0.45" />
        <stop stop-color="#d6249f" offset="0.6" />
        <stop stop-color="#285AEB" offset="0.9" />
      </radialGradient>
    </svg>
    <fa-icon :icon="['fab', 'instagram']" class="instagram-icon" />
  </span>
</template>

<script setup lang="ts">
import { useId } from 'vue';

defineOptions({ name: 'IconInstagram' });

const gradientId = `instagram-gradient-${useId()}`;
</script>

<style scoped>
.gradient {
  position: absolute;
}

.instagram-icon * {
  fill: var(--instagram-fill);
}
</style>
