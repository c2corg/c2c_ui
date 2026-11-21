<template>
  <!-- a rail of icons, which opens over the page on hover or from the keyboard, or pinned open beside the page
       (src/js/composables/side-menu.ts) -->
  <aside
    :class="{ 'is-expanded': expanded || keptOpen, 'is-pinned': pinned || keptOpen }"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @keydown.esc="close"
    @click="onClick"
  >
    <!-- as wide as the open menu, which the rail clips: nothing wraps or moves while it opens -->
    <div class="side-menu-content">
      <!-- the logo inline (LogoCtc): its text turns light in the dark theme -->
      <a :href="'/'" class="menu-brand" aria-label="Camptocamp.org">
        <logo-ctc class="menu-logo" />
        <logo-ctc mark class="menu-logo-mark" />
      </a>
      <menu-entries :items="visibleItems" />

      <menu-footer class="menu-footer" />

      <button
        :style="{ visibility: keptOpen ? 'hidden' : undefined }"
        type="button"
        class="menu-pin"
        @click="togglePinned"
      >
        <fa-icon :icon="pinned ? 'angles-left' : 'angles-right'" fixed-width />
        <span class="menu-pin-text">
          {{ pinned ? $gettext('Collapse the menu') : $gettext('Keep the menu open') }}
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import LogoCtc from '@/components/app/LogoCtc.vue';
import MenuEntries from '@/components/app/MenuEntries.vue';
import MenuFooter from '@/components/app/MenuFooter.vue';
import { useMainMenuItems } from '@/js/composables/main-menu';
import { useSideMenu } from '@/js/composables/side-menu';

defineProps<{ keptOpen?: boolean }>();

const menuItems = useMainMenuItems();
const isTall = ref(false);
// Yeti only when the window is tall enough
const visibleItems = computed(() => menuItems.value.filter((item) => !item.tallOnly || isTall.value));

const { pinned, expanded, onPointerEnter, onPointerLeave, onFocusIn, onFocusOut, close, togglePinned } = useSideMenu();

// a link followed (or the cookies opened): the menu closes over the page it opens
function onClick(event: MouseEvent) {
  if (!pinned.value && (event.target as Element).closest('a')) {
    close();
  }
}

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
  /* opens decelerating, closes a little faster */
  --side-menu-open: 200ms cubic-bezier(0.2, 0, 0, 1);
  --side-menu-close: 150ms cubic-bezier(0.4, 0, 1, 1);

  width: var(--c2c-sidemenu-rail-width);
  /* too tall for the window (large text, short screen): it scrolls, without a bar in the rail */
  overflow: hidden auto;
  scrollbar-width: none;
  /* border-right: 1px solid var(--c2c-secondary); */
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.2);
  background: var(--c2c-white);
  transition:
    width var(--side-menu-close),
    box-shadow var(--side-menu-close);

  &.is-expanded {
    width: var(--c2c-sidemenu-open-width);
    transition:
      width var(--side-menu-open),
      box-shadow var(--side-menu-open);
  }

  /* over the page: it floats */
  &.is-expanded:not(.is-pinned) {
    box-shadow:
      0 1px 4px 0 rgba(0, 0, 0, 0.2),
      8px 0 24px -4px rgba(0, 0, 0, 0.18);
  }
}

.side-menu-content {
  display: flex;
  flex-direction: column;
  width: var(--c2c-sidemenu-open-width);
  min-height: 100%;
}

/* the labels, the logo and the footer: shown as the menu opens, hidden before it closes. Still read out on the rail */
.menu-logo,
.menu-footer,
.menu-pin-text,
:deep(.menu-item-text),
:deep(.menu-badge) {
  opacity: 0;
  transition: opacity 100ms linear;
}

.is-expanded {
  .menu-logo,
  .menu-footer,
  .menu-pin-text,
  :deep(.menu-item-text),
  :deep(.menu-badge) {
    opacity: 1;
    transition: opacity 150ms linear 50ms;
  }
}

.menu-brand {
  position: relative;
  display: block;
  flex: none;
  height: 80px;
  line-height: 0;

  .menu-logo {
    position: absolute;
    top: 5px;
    left: 50%;
    height: 70px;
    transform: translateX(-50%);
  }

  /* the mountains alone, in the middle of the rail */
  .menu-logo-mark {
    position: absolute;
    top: 50%;
    left: calc(var(--c2c-sidemenu-rail-width) / 2);
    width: calc(var(--c2c-sidemenu-rail-width) - 12px);
    height: auto;
    transform: translate(-50%, -50%);
    transition: opacity 150ms linear 50ms;
  }
}

.is-expanded .menu-brand .menu-logo-mark {
  opacity: 0;
  transition: opacity 100ms linear;
}

/* the icons in the middle of the rail, all as wide (the layered icons of the outings too) */
:deep(.menu-item) {
  padding-left: calc(var(--c2c-sidemenu-rail-width) / 2 - 5px - 0.625em);

  > .fa-layers {
    width: 1.25em;
  }
}

/* on the rail, the current entry has more than its orange border */
aside:not(.is-expanded) :deep(.menu-item.router-link-active) {
  background: rgba(255, 153, 51, 0.14);
}

.menu-footer {
  flex: none;
  margin-top: auto;
  /* closed, not focusable: the keyboard opens the menu on its way */
  visibility: hidden;
  transition:
    opacity 100ms linear,
    visibility 0s 100ms;
}

.is-expanded .menu-footer {
  visibility: visible;
}

.menu-pin {
  display: block;
  flex: none;
  width: 100%;
  padding: 10px 10px 10px calc(var(--c2c-sidemenu-rail-width) / 2 - 0.625em);
  border: 0;
  border-top: 1px solid var(--c2c-grey-lightest);
  background: none;
  color: var(--c2c-grey);
  font-size: 1rem;
  white-space: nowrap;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--c2c-light);
    color: var(--c2c-text);
  }

  .menu-pin-text {
    margin-left: 0.5em;
  }
}

@media screen and (max-height: 680px) {
  .menu-footer :deep(.menu-socials) {
    display: none !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  aside,
  aside *,
  aside :deep(*) {
    transition: none !important;
  }
}

/* the dark theme of the app (src/stores/app-settings.ts, App.vue): a dark menu */
html[data-theme='dark'] aside {
  background: var(--app-dark-field);
}

/* a shadow does not show on the dark page: an edge too */
html[data-theme='dark'] aside.is-expanded:not(.is-pinned) {
  box-shadow:
    1px 0 0 var(--app-dark-border),
    8px 0 24px -4px rgba(0, 0, 0, 0.6);
}

html[data-theme='dark'] .menu-pin:hover {
  background: var(--app-dark-surface);
}
</style>
