const BREAKPOINT_MOBILE = 768;
const BREAKPOINT_TABLET = 1023;
const BREAKPOINT_DESKTOP = 1215;
const BREAKPOINT_WIDESCREEN = 1407;

export default function install(Vue) {
  Vue.prototype.$screen = new Vue({
    name: 'Screen',

    data() {
      return {
        matchingQueryIndex: -1,
      };
    },

    // https://bulma.io/documentation/modifiers/responsive-helpers/
    computed: {
      isMobile() {
        return this.matchingQueryIndex === 0;
      },
      isTablet() {
        return this.matchingQueryIndex === 1;
      },
      isDesktop() {
        return this.matchingQueryIndex === 2;
      },
      isWidescreen() {
        return this.matchingQueryIndex === 3;
      },
      isFullHD() {
        return this.matchingQueryIndex === -1;
      },
    },

    created() {
      this.mediaQueryLists = [
        BREAKPOINT_MOBILE,
        BREAKPOINT_TABLET,
        BREAKPOINT_DESKTOP,
        BREAKPOINT_WIDESCREEN,
      ].map((breakpoint) => window.matchMedia(`only screen and (max-width: ${breakpoint}px)`));
      this.mediaQueryLists.forEach((mediaQueryList) => {
        if (mediaQueryList.addEventListener) {
          mediaQueryList.addEventListener('change', this.onMediaQueryChange);
        } else {
          // support Safari < 14
          mediaQueryList.addListener(this.onMediaQueryChange);
        }
      });
      this.onMediaQueryChange(); // init
    },

    beforeDestroy() {
      this.mediaQueryLists.forEach((mediaQueryList) => {
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', this.onMediaQueryChange);
        } else {
          mediaQueryList.removeListener(this.onMediaQueryChange);
        }
      });
    },

    methods: {
      onMediaQueryChange() {
        this.matchingQueryIndex = this.mediaQueryLists.findIndex((mediaQueryList) => mediaQueryList.matches);
      },
    },
  });
}
