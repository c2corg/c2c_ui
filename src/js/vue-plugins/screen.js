
const BREAKPOINT_MOBILE = 768;
const BREAKPOINT_TABLET = 1023;
const BREAKPOINT_DESKTOP = 1215;
const BREAKPOINT_WIDESCREEN = 1407;

export default function install(Vue) {
  Vue.prototype.$screen = new Vue({
    name: 'Screen',

    data() {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    },

    // https://bulma.io/documentation/modifiers/responsive-helpers/
    computed: {
      isMobile() {
        return this.width <= BREAKPOINT_MOBILE;
      },
      isTablet() {
        return this.width > BREAKPOINT_MOBILE && this.width <= BREAKPOINT_TABLET;
      },
      isDesktop() {
        return this.width > BREAKPOINT_TABLET && this.width <= BREAKPOINT_DESKTOP;
      },
      isWidescreen() {
        return this.width > BREAKPOINT_DESKTOP && this.width <= BREAKPOINT_WIDESCREEN;
      },
      isFullHD() {
        return this.width > BREAKPOINT_WIDESCREEN;
      }
    },

    created() {
      window.addEventListener('resize', this.onResize);
    },

    methods: {
      onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
      }
    }
  });
}
