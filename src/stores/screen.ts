// The size of the screen, as Bulma's breakpoints name it: https://bulma.io/documentation/modifiers/responsive-helpers/
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const BREAKPOINT_MOBILE = 768;
const BREAKPOINT_TABLET = 1023;
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
