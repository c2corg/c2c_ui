// The size of the screen, as Bulma's breakpoints name it: https://bulma.io/documentation/modifiers/responsive-helpers/
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

// the width from which the navigation of the site is on the side (side menu, top navigation), and under which it is
// the phone layout (top bar with the menu button, bottom tab bar): the only one place to decide it. Bulma's desktop
export const DESKTOP_BREAKPOINT = 1024;

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
