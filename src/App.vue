<template>
  <div
    id="app"
    :class="{
      'nav-dfm': !homePage() && !$screen.isMobile && !$screen.isTablet && !$screen.isDesktop,
      'home-topoguide': homePage(),
    }"
  >
    <side-menu class="side-menu no-print" :class="{ 'alternative-side-menu': alternativeSideMenu }" />
    <navigation class="navigation no-print" @toggle-side-menu="alternativeSideMenu = !alternativeSideMenu" />
    <dfm-ad-small v-if="!homePage() && ($screen.isMobile || $screen.isTablet || $screen.isDesktop)" class="ad" />
    <site-notice ref="siteNotice no-print" class="no-print site-notice" />
    <image-viewer ref="imageViewer" />
    <helper-window ref="helper" />
    <alert-window ref="alertWindow" />
    <div v-if="alternativeSideMenu" class="alternative-side-menu-shader" @click="alternativeSideMenu = false" />

    <!-- keep router view in last -->
    <div class="page-content is-block-print">
      <router-view class="router-view" />
    </div>
    <gdpr-banner></gdpr-banner>
  </div>
</template>

<script>
import AlertWindow from './components/alert-window/AlertWindow';
import GdprBanner from './components/gdpr/GdprBanner.vue';
import HelperWindow from './components/helper/HelperWindow';
import ImageViewer from './components/image-viewer/ImageViewer';
import DfmAdSmall from './views/DfmAdSmall.vue';
import Navigation from './views/Navigation';
import SideMenu from './views/SideMenu';
import SiteNotice from './views/SiteNotice';

export default {
  name: 'App',

  components: {
    DfmAdSmall,
    SideMenu,
    Navigation,
    SiteNotice,
    HelperWindow,
    ImageViewer,
    AlertWindow,
    GdprBanner,
  },

  data() {
    return {
      alternativeSideMenu: false,
    };
  },

  watch: {
    $route: 'hideSideMenuOnMobile',
  },

  mounted() {
    document.getElementById('splashscreen').style.display = 'none';
    this.updateWidth();
    window.addEventListener('resize', this.updateWidth);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.updateWidth);
  },

  methods: {
    hideSideMenuOnMobile() {
      this.alternativeSideMenu = false;
    },
    updateWidth() {
      // allows reactive css when body width changes because map is pinned
      // (unlike the css @media(max-width) this is replacing)

      const bulmaBreakpoints = {
        tablet: 769,
        desktop: 1024,
        widescreen: 1216,
        fullhd: 1408,
      };
      const width = this.$el.offsetWidth;
      if (width <= bulmaBreakpoints.tablet) {
        this.$el.dataset.width = 'mobile';
      } else if (width <= bulmaBreakpoints.desktop) {
        this.$el.dataset.width = 'tablet';
      } else {
        this.$el.dataset.width = 'desktop';
      }
    },
    homePage() {
      if (this.$route.path === '/home' || this.$route.path === '/') {
        return true;
      } else {
        return false;
      }
    },
  },
};
</script>

<style lang="scss">
$body-height: calc(100vh - #{$navbar-height});

html {
  overflow-x: hidden;
  overflow-y: scroll;
  text-rendering: optimizeLegibility;
  text-size-adjust: 100%;
}

html,
body,
#app {
  min-height: $body-height;
}

.navigation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 25;
}

.side-menu {
  width: $sidemenu-width;
  height: 100vh;
  position: fixed;
  top: 0px;
  z-index: 30;
  transition: 0.3s;
}

.alternative-side-menu-shader {
  z-index: 29;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.2);
}

.site-notice {
  position: absolute;
  top: $navbar-height;
  width: 100%;
  z-index: 20;
  box-shadow: 0 5px 10px 0px rgba(10, 10, 10, 0.5);
}

.page-content {
  min-height: 100vh;
  display: flex;
  flex-flow: column;
}

.home-topoguide {
  .page-content {
    padding-top: $navbar-height;
  }

  .ams-ad {
    margin-left: auto !important;
    padding-top: 0px !important;
  }
}

.nav-dfm {
  $body-height-ad: calc(100vh - #{$navbarad-height});

  html,
  body,
  #app {
    min-height: $body-height-ad;
  }

  .site-notice {
    top: $navbarad-height;
  }

  .page-content {
    padding-top: $navbarad-height;
  }
}

@media screen {
  [data-width='mobile'] {
    .side-menu {
      left: -$sidemenu-width;
    }

    .alternative-side-menu {
      left: 0;
    }

    .page-content,
    .ad {
      margin-left: 0;
    }
    .ad {
      padding-top: $navbar-height;
    }

    .section {
      padding: 0.75rem !important;
    }

    .box:not(:last-child),
    .feed-card {
      margin-bottom: 0.75rem !important;
    }
  }

  [data-width='tablet'] {
    .side-menu {
      left: -$sidemenu-width;
    }

    .alternative-side-menu {
      left: 0;
    }

    .page-content,
    .ad {
      margin-left: 0;
    }

    .ad {
      padding-top: $navbar-height;
    }
  }

  [data-width='desktop'] {
    .side-menu {
      left: 0;
    }
    .page-content,
    .ad {
      margin-left: $sidemenu-width;
    }

    .ad {
      padding-top: $navbar-height;
    }

    .site-notice {
      padding-left: $sidemenu-width;
    }
  }
}

.router-view {
  flex-grow: 1;
}

@media print {
  /* print styles go here */
  .page-content {
    padding-top: 0;
  }

  html {
    font-size: 12px !important;
  }
}
</style>
