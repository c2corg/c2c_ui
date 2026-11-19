<template>
  <aside>
    <!-- the logo inline (LogoCtc): its text turns light in the dark theme -->
    <a :href="'/'" class="menu-brand has-text-centered" aria-label="Camptocamp.org">
      <logo-ctc />
    </a>
    <menu-entries :items="visibleItems" />

    <menu-footer class="menu-footer" />
  </aside>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import LogoCtc from '@/components/app/LogoCtc.vue';
import MenuEntries from '@/components/app/MenuEntries.vue';
import MenuFooter from '@/components/app/MenuFooter.vue';
import { useMainMenuItems } from '@/js/composables/main-menu';

const menuItems = useMainMenuItems();
const isTall = ref(false);
// Yeti only when the window is tall enough
const visibleItems = computed(() => menuItems.value.filter((item) => !item.tallOnly || isTall.value));

function onHeightBreakpointChange() {
  isTall.value = mediaQueryList.matches;
}

const mediaQueryList = window.matchMedia('only screen and (min-height: 715px)');
if (mediaQueryList.addEventListener) {
  mediaQueryList.addEventListener('change', onHeightBreakpointChange);
} else {
  // Safari < 14 support
  mediaQueryList.addListener(onHeightBreakpointChange);
}
onHeightBreakpointChange();

onBeforeUnmount(() => {
  if (mediaQueryList.removeEventListener) {
    mediaQueryList.removeEventListener('change', onHeightBreakpointChange);
  } else {
    // Safari < 14 support
    mediaQueryList.removeListener(onHeightBreakpointChange);
  }
});
</script>

<style scoped>
aside {
  /* border-right: 1px solid var(--c2c-secondary); */
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.2);
  background: var(--c2c-white);
}

.menu-brand {
  display: block;
  line-height: 0;

  .logo-ctc {
    display: inline-block;
    width: auto;
    height: 70px;
    margin: 5px 0;
  }
}

.menu-footer {
  position: absolute;
  width: 100%;
  bottom: 0;
}

@media screen and (max-height: 680px) {
  .menu-footer :deep(.menu-socials) {
    display: none !important;
  }
}

/* the dark theme of the app (src/stores/app-settings.ts, App.vue): a dark menu */
html[data-theme='dark'] aside {
  background: var(--app-dark-field);
}
</style>
