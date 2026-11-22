// The size of the screen, as Bulma's breakpoints name it: https://bulma.io/documentation/modifiers/responsive-helpers/
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

// Bulma's desktop: from it, the side menu may be pinned open beside the page (src/js/composables/side-menu.ts)
export const DESKTOP_BREAKPOINT = 1024;

// the width from which the navigation of the site is on the side (the rail of the side menu, top navigation), and under
// which it is the phone layout (top bar with the menu button, bottom tab bar): phones held upright only, a phone on its
// side or a tablet has the rail (c2corg/c2c_ui#5154). The only one place to decide it
export const PHONE_BREAKPOINT = 600;

const BREAKPOINT_MOBILE = 768;
const BREAKPOINT_TABLET = DESKTOP_BREAKPOINT - 1;
const BREAKPOINT_DESKTOP = 1215;
const BREAKPOINT_WIDESCREEN = 1407;

export const useScreenStore = defineStore('screen', () => {
  // the first breakpoint the screen is under (mobile, tablet, desktop, widescreen), -1 above them all (full HD)
  const matchingQueryIndex = ref(-1);

  const breakpointsMediaQueryLists = [
    BREAKPOINT_MOBILE,
    BREAKPOINT_TABLET,
    BREAKPOINT_DESKTOP,
    BREAKPOINT_WIDESCREEN,
  ].map((breakpoint) => window.matchMedia(`only screen and (max-width: ${breakpoint}px)`));

  const onBreakpointMediaQueryChange = () => {
    matchingQueryIndex.value = breakpointsMediaQueryLists.findIndex((mediaQueryList) => mediaQueryList.matches);
  };

  breakpointsMediaQueryLists.forEach((mediaQueryList) => {
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', onBreakpointMediaQueryChange);
    } else {
      // support Safari < 14
      mediaQueryList.addListener(onBreakpointMediaQueryChange);
    }
  });
  onBreakpointMediaQueryChange(); // init

  const isMobile = computed(() => matchingQueryIndex.value === 0);
  const isTablet = computed(() => matchingQueryIndex.value === 1);
  const isDesktop = computed(() => matchingQueryIndex.value === 2);
  const isWidescreen = computed(() => matchingQueryIndex.value === 3);
  const isFullHD = computed(() => matchingQueryIndex.value === -1);

  return { isMobile, isTablet, isDesktop, isWidescreen, isFullHD };
});

export type Screen = ReturnType<typeof useScreenStore>;
