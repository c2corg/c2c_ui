<template>
  <div id="app">
    <side-menu class="side-menu no-print" :class="{ 'alternative-side-menu': alternativeSideMenu }" />
    <navigation class="navigation no-print" @toggle-side-menu="alternativeSideMenu = !alternativeSideMenu" />
    <site-notice class="no-print site-notice" />
    <offline-notice class="no-print offline-notice" />
    <image-viewer ref="imageViewer" />
    <helper-window ref="helper" />
    <alert-window ref="alertWindow" />
    <gdpr-banner></gdpr-banner>
    <div v-if="alternativeSideMenu" class="alternative-side-menu-shader" @click="alternativeSideMenu = false" />

    <!-- keep router view in last -->
    <div class="page-content is-block-print">
      <router-view class="router-view" />
    </div>
  </div>
</template>

<script>
import AlertWindow from './components/alert-window/AlertWindow';
import GdprBanner from './components/gdpr/GdprBanner.vue';
import HelperWindow from './components/helper/HelperWindow';
import ImageViewer from './components/image-viewer/ImageViewer';
import Navigation from './views/Navigation';
import SideMenu from './views/SideMenu';
import SiteNotice from './views/SiteNotice';
import OfflineNotice from './views/offline/OfflineNotice';

export default {
  name: 'App',

  components: {
    AlertWindow,
    GdprBanner,
    HelperWindow,
    ImageViewer,
    Navigation,
    OfflineNotice,
    SideMenu,
    SiteNotice,
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
  },

  methods: {
    hideSideMenuOnMobile() {
      this.alternativeSideMenu = false;
    },
  },
};
</script>

<style lang="scss">
$sidemenu-width: 200px;
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

.offline-notice {
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 20;
}

.page-content {
  min-height: 100vh;
  padding-top: $navbar-height;
  display: flex;
  flex-flow: column;
}

@media screen and (max-width: $tablet) {
  .side-menu {
    left: -$sidemenu-width;
  }

  .alternative-side-menu {
    left: 0;
  }

  .page-content {
    margin-left: 0;
  }

  .section {
    padding: 0.75rem !important;
  }

  .box:not(:last-child),
  .feed-card {
    margin-bottom: 0.75rem !important;
  }
}

@media screen and (min-width: $tablet) and (max-width: $desktop) {
  .side-menu {
    left: -$sidemenu-width;
  }

  .alternative-side-menu {
    left: 0;
  }

  .page-content {
    margin-left: 0;
  }
}

@media screen and (min-width: $desktop) and (max-width: $widescreen) {
  .page-content {
    margin-left: $sidemenu-width;
  }

  .site-notice {
    padding-left: $sidemenu-width;
  }
}

@media screen and (min-width: $widescreen) and (max-width: $fullhd) {
  .page-content {
    margin-left: $sidemenu-width;
  }

  .site-notice {
    padding-left: $sidemenu-width;
  }
}

@media screen and (min-width: $fullhd) {
  .page-content {
    margin-left: $sidemenu-width;
  }

  .site-notice {
    padding-left: $sidemenu-width;
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
