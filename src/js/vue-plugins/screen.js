import { reactive } from 'vue';

const BREAKPOINT_MOBILE = 768;
const BREAKPOINT_TABLET = 1023;
const BREAKPOINT_DESKTOP = 1215;
const BREAKPOINT_WIDESCREEN = 1407;

export default function install(app) {
  const state = reactive({ matchingQueryIndex: -1 });

  const breakpointsMediaQueryLists = [
    BREAKPOINT_MOBILE,
    BREAKPOINT_TABLET,
    BREAKPOINT_DESKTOP,
    BREAKPOINT_WIDESCREEN,
  ].map((breakpoint) => window.matchMedia(`only screen and (max-width: ${breakpoint}px)`));

  const onBreakpointMediaQueryChange = () => {
    state.matchingQueryIndex = breakpointsMediaQueryLists.findIndex((mediaQueryList) => mediaQueryList.matches);
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

  // https://bulma.io/documentation/modifiers/responsive-helpers/
  app.config.globalProperties.$screen = {
    get isMobile() {
      return state.matchingQueryIndex === 0;
    },
    get isTablet() {
      return state.matchingQueryIndex === 1;
    },
    get isDesktop() {
      return state.matchingQueryIndex === 2;
    },
    get isWidescreen() {
      return state.matchingQueryIndex === 3;
    },
    get isFullHD() {
      return state.matchingQueryIndex === -1;
    },
  };
}
