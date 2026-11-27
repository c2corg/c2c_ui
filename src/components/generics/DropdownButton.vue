<template>
  <div ref="root" :class="{ 'is-active': isActive }" class="dropdown">
    <div class="dropdown-trigger" @click="isActive = !isActive && !disabled">
      <span aria-haspopup="true" :aria-controls="'dropdown-menu-' + id">
        <slot name="button" />
      </span>
    </div>

    <div
      :id="'dropdown-menu-' + id"
      ref="menu"
      class="dropdown-menu"
      role="menu"
      :style="shift ? { transform: `translateX(${shift}px)` } : undefined"
    >
      <div class="dropdown-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';

defineProps({
  disabled: {
    type: Boolean,
    default: null,
  },
});

const isActive = ref(false);
const id = Math.random().toString().substring(2, 6);
const rootElement = useTemplateRef<HTMLElement>('root');
const menuElement = useTemplateRef<HTMLElement>('menu');

// the menu opens under its button, aligned on its left edge (right edge with is-right). When it
// overflows the viewport, it is aligned on the other edge of the button, else on the viewport edge.
// CSS anchor positioning (position-try-fallbacks) would do it, but not in all the browsers we
// support (.browserslistrc)
const VIEWPORT_MARGIN = 8;
const shift = ref(0);

function placeMenu() {
  const button = rootElement.value?.querySelector('.dropdown-trigger')?.getBoundingClientRect();
  const menu = menuElement.value?.getBoundingClientRect();
  if (!button || !menu) {
    return;
  }
  const min = VIEWPORT_MARGIN;
  const max = document.documentElement.clientWidth - VIEWPORT_MARGIN - menu.width;
  const fits = (left: number) => left >= min && left <= max;
  const alignedLeft = button.left;
  const alignedRight = button.right - menu.width;
  const [preferred, other] = menu.left === alignedLeft ? [alignedLeft, alignedRight] : [alignedRight, alignedLeft];
  const left = fits(preferred) ? preferred : fits(other) ? other : Math.max(min, Math.min(max, preferred));
  shift.value = left - menu.left;
}

async function resetAndPlaceMenu() {
  shift.value = 0;
  await nextTick();
  placeMenu();
}

// placed again when the window is resized (or the phone rotated) while the menu is open, once the
// resizes end: the page lays itself out again after the resize event (screen store, re-renders)
let resizeTimeout: ReturnType<typeof setTimeout> | undefined;

function onResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resetAndPlaceMenu, 100);
}

watch(isActive, async (active) => {
  if (!active) {
    shift.value = 0;
    clearTimeout(resizeTimeout);
    window.removeEventListener('resize', onResize);
    return;
  }
  window.addEventListener('resize', onResize);
  await resetAndPlaceMenu();
});

function onClick(event: MouseEvent) {
  // close dropdown when clicked outside
  if (!rootElement.value?.contains(event.target as Node)) {
    isActive.value = false;
  }
}

window.addEventListener('click', onClick);

onBeforeUnmount(() => {
  window.removeEventListener('click', onClick);
  clearTimeout(resizeTimeout);
  window.removeEventListener('resize', onResize);
});

// the menus close themselves when one of their items is clicked: $refs.menu.isActive = false
defineExpose({ isActive });
</script>
<style scoped>
@import '@/assets/css/media.css';

.dropdown-menu {
  @media screen and (--c2c-max-tablet) {
    /* fit the longest item (e.g. "Traqueurs d'activité"), within the viewport:
       a percentage max-width refers to the trigger button, so min-width won */
    width: max-content;
    max-width: calc(100vw - 1rem);
  }
}
</style>
