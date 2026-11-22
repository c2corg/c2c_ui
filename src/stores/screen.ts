// The size of the screen, as Bulma's breakpoints name it: https://bulma.io/documentation/modifiers/responsive-helpers/
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

// The breakpoints of the site, the widths each size starts from: Bulma's (tablet to full HD), and the phone layout of
// the app. The only one place to decide them: the custom media queries of src/assets/css/media.css are checked
// against them (styles.spec.ts)

// the width from which the navigation of the site is on the side (the rail of the side menu, top navigation), and under
// which it is the phone layout (top bar with the menu button, bottom tab bar): phones held upright only, a phone on its
// side or a tablet has the rail (c2corg/c2c_ui#5154). CSS follows it as html[data-shell] (src/stores/app-settings.ts)
export const PHONE_BREAKPOINT = 600;
export const TABLET_BREAKPOINT = 769;
// from it, the side menu may also be pinned open beside the page (src/js/composables/side-menu.ts)
export const DESKTOP_BREAKPOINT = 1024;
export const WIDESCREEN_BREAKPOINT = 1216;
export const FULLHD_BREAKPOINT = 1408;

export const useScreenStore = defineStore('screen', () => {
  // the first breakpoint the screen is under (mobile, tablet, desktop, widescreen), -1 above them all (full HD)
  const matchingQueryIndex = ref(-1);

  const breakpointsMediaQueryLists = [
    TABLET_BREAKPOINT,
    DESKTOP_BREAKPOINT,
    WIDESCREEN_BREAKPOINT,
    FULLHD_BREAKPOINT,
  ].map((breakpoint) => window.matchMedia(`only screen and (max-width: ${breakpoint - 1}px)`));

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

  // from DESKTOP_BREAKPOINT on
  const isDesktopOrWider = computed(() => !isMobile.value && !isTablet.value);

  return { isMobile, isTablet, isDesktop, isWidescreen, isFullHD, isDesktopOrWider };
});

export type Screen = ReturnType<typeof useScreenStore>;
