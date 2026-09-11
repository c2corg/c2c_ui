import { computed, reactive } from 'vue';

const BREAKPOINT_MOBILE = 768;
const BREAKPOINT_TABLET = 1023;
const BREAKPOINT_DESKTOP = 1215;
const BREAKPOINT_WIDESCREEN = 1407;

export default function install(app) {
  const screen = reactive({
    matchingQueryIndex: -1,
  });

  // https://bulma.io/documentation/modifiers/responsive-helpers/
  screen.isMobile = computed(() => screen.matchingQueryIndex === 0);
  screen.isTablet = computed(() => screen.matchingQueryIndex === 1);
  screen.isDesktop = computed(() => screen.matchingQueryIndex === 2);
  screen.isWidescreen = computed(() => screen.matchingQueryIndex === 3);
  screen.isFullHD = computed(() => screen.matchingQueryIndex === -1);

  const breakpointsMediaQueryLists = [
    BREAKPOINT_MOBILE,
    BREAKPOINT_TABLET,
    BREAKPOINT_DESKTOP,
    BREAKPOINT_WIDESCREEN,
  ].map((breakpoint) => window.matchMedia(`only screen and (max-width: ${breakpoint}px)`));

  const onBreakpointMediaQueryChange = function () {
    screen.matchingQueryIndex = breakpointsMediaQueryLists.findIndex((mediaQueryList) => mediaQueryList.matches);
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

  // Note: this singleton lives for the whole app lifetime (never destroyed), so there is no
  // teardown of these listeners (the former beforeDestroy() hook never actually ran in practice).

  app.config.globalProperties.$screen = screen;
}
