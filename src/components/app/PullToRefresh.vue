<template>
  <!-- the arrow that follows the finger pulling the top of the page, then turns while the page refreshes -->
  <div class="pull-to-refresh" :class="{ 'is-pulling': pulling }" :style="indicatorStyle" aria-hidden="true">
    <fa-icon :icon="refreshing ? 'rotate' : 'arrow-down'" :spin="refreshing" :class="{ 'is-ready': ready }" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { pullRefresh } from '@/js/composables/pull-refresh';

// how far to pull to refresh, and how far the arrow follows
const THRESHOLD = 70;
const MAX_PULL = 110;
// a refresh that takes longer: the arrow goes, the page goes on loading
const MAX_SPIN_MS = 4000;

const pulling = ref(false);
const refreshing = ref(false);
const pullY = ref(0);
let startY = 0;

const ready = computed(() => pullY.value >= THRESHOLD);
const indicatorStyle = computed(() => {
  if (refreshing.value) {
    return { transform: `translate(-50%, ${THRESHOLD * 0.6}px)`, opacity: 1 };
  }
  if (pulling.value) {
    const y = Math.min(pullY.value, MAX_PULL);
    return { transform: `translate(-50%, ${y * 0.6}px)`, opacity: Math.min(1, y / THRESHOLD) };
  }
  return { transform: 'translate(-50%, -40px)', opacity: 0 };
});

const atTop = () => (document.scrollingElement?.scrollTop ?? window.scrollY) <= 0;

function onTouchStart(event: TouchEvent) {
  if (refreshing.value || !atTop() || event.touches.length !== 1) {
    return;
  }
  startY = event.touches[0].clientY;
  pulling.value = true;
  pullY.value = 0;
}

function onTouchMove(event: TouchEvent) {
  if (!pulling.value) {
    return;
  }
  const dy = event.touches[0].clientY - startY;
  if (dy < 0 || !atTop()) {
    // the page scrolls down: not a pull
    pulling.value = false;
    return;
  }
  pullY.value = dy;
}

async function onTouchEnd() {
  if (!pulling.value) {
    return;
  }
  pulling.value = false;
  if (!ready.value) {
    return;
  }
  pullY.value = 0;
  refreshing.value = true;
  await Promise.race([pullRefresh(), new Promise((resolve) => setTimeout(resolve, MAX_SPIN_MS))]);
  refreshing.value = false;
}

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

onMounted(() => {
  if (reducedMotion) {
    return;
  }
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('touchcancel', onTouchEnd);
});

onBeforeUnmount(() => {
  window.removeEventListener('touchstart', onTouchStart);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);
  window.removeEventListener('touchcancel', onTouchEnd);
});
</script>

<style scoped>
.pull-to-refresh {
  position: fixed;
  top: calc(52px + env(safe-area-inset-top));
  left: 50%;
  z-index: 27;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--c2c-white);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: var(--c2c-primary);
  pointer-events: none;
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;

  /* follows the finger as it is, no smoothing */
  &.is-pulling {
    transition: none;
  }

  .is-ready {
    transform: rotate(180deg);
    transition: transform 0.15s;
  }
}

:global(html[data-theme='dark']) .pull-to-refresh {
  background: #2a2a2a;
}
</style>
