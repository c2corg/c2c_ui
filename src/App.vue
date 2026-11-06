<template>
  <div
    id="app"
    ref="app"
    :class="{
      'nav-dfm': !homePage && !$screen.isMobile && !$screen.isTablet && !$screen.isDesktop,
      'home-topoguide': homePage,
    }"
  >
    <environment-banner />
    <side-menu class="side-menu no-print" :class="{ 'alternative-side-menu': alternativeSideMenu }" />
    <navigation class="navigation no-print" @toggle-side-menu="alternativeSideMenu = !alternativeSideMenu" />
    <dfm-ad-small v-if="!homePage && ($screen.isMobile || $screen.isTablet || $screen.isDesktop)" class="ad" />
    <site-notice class="no-print site-notice" />
    <image-viewer v-if="imageViewerRequested" />
    <helper-window />
    <alert-window />
    <div v-if="alternativeSideMenu" class="alternative-side-menu-shader" @click="alternativeSideMenu = false" />

    <!-- the phone layout of the app: a top bar and a bottom tab bar instead of the side menu and the navigation -->
    <mobile-top-bar v-if="appSettings.isMobileShell" />

    <!-- keep router view in last -->
    <div class="page-content is-block-print">
      <!-- without a network: what still opens -->
      <div v-if="!offline.online && !offlineBannerClosed" class="offline-banner no-print" role="status">
        <router-link :to="{ name: 'offline' }">
          <fa-icon icon="plug" />&nbsp;{{ $gettext('Offline: open My topos') }}
        </router-link>
        <button
          type="button"
          class="delete is-small"
          :aria-label="$gettext('Close')"
          @click="offlineBannerClosed = true"
        />
      </div>
      <router-view class="router-view" />
    </div>
    <gdpr-banner></gdpr-banner>
    <template v-if="appSettings.isMobileShell">
      <bottom-nav />
      <onboarding-tour />
      <pull-to-refresh />
    </template>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import AlertWindow from './components/alert-window/AlertWindow.vue';
import BottomNav from './components/app/BottomNav.vue';
import MobileTopBar from './components/app/MobileTopBar.vue';
import OnboardingTour from './components/app/OnboardingTour.vue';
import PullToRefresh from './components/app/PullToRefresh.vue';
import GdprBanner from './components/gdpr/GdprBanner.vue';
import EnvironmentBanner from './components/generics/EnvironmentBanner.vue';
import HelperWindow from './components/helper/HelperWindow.vue';
import DfmAdSmall from './views/DfmAdSmall.vue';
import Navigation from './views/Navigation.vue';
import SideMenu from './views/SideMenu.vue';
import SiteNotice from './views/SiteNotice.vue';

import { useIsHomePage } from '@/js/composables/home-page';
import { imageViewerRequested } from '@/js/vue-plugins/image-viewer';
import { useAppSettingsStore } from '@/stores/app-settings';
import { useOfflineStore } from '@/stores/offline';

// loaded with the first image shown, with Swiper (#4877)
const ImageViewer = defineAsyncComponent(() => import('./components/image-viewer/ImageViewer.vue'));

defineOptions({ name: 'App' });

const route = useRoute();
const app = useTemplateRef<HTMLDivElement>('app');

const alternativeSideMenu = ref(false);

const homePage = useIsHomePage();

const appSettings = useAppSettingsStore();

const offline = useOfflineStore();
// closed until the network comes back and goes again
const offlineBannerClosed = ref(false);
watch(
  () => offline.online,
  (online) => {
    if (online) {
      offlineBannerClosed.value = false;
    }
  }
);

function hideSideMenuOnMobile() {
  alternativeSideMenu.value = false;
}

watch(() => route.fullPath, hideSideMenuOnMobile);

function updateWidth() {
  // allows reactive css when body width changes because map is pinned
  // (unlike the css @media(max-width) this is replacing)

  const bulmaBreakpoints = {
    tablet: 769,
    desktop: 1024,
    widescreen: 1216,
    fullhd: 1408,
  };
  const width = app.value!.offsetWidth;
  if (width <= bulmaBreakpoints.tablet) {
    app.value!.dataset.width = 'mobile';
  } else if (width <= bulmaBreakpoints.desktop) {
    app.value!.dataset.width = 'tablet';
  } else {
    app.value!.dataset.width = 'desktop';
  }
}

onMounted(() => {
  document.getElementById('splashscreen')!.style.display = 'none';
  updateWidth();
  window.addEventListener('resize', updateWidth);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWidth);
});
</script>

<style>
html {
  overflow-x: hidden;
  overflow-y: scroll;
  text-rendering: optimizeLegibility;
  text-size-adjust: 100%;
}

html,
body,
#app {
  min-height: calc(100vh - var(--c2c-navbar-height));
}

.navigation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 25;
}

.side-menu {
  width: var(--c2c-sidemenu-width);
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
  top: var(--c2c-navbar-height);
  width: 100%;
  z-index: 20;
  box-shadow: 0 5px 10px 0px rgba(10, 10, 10, 0.5);
}

.offline-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--c2c-yellow);

  a {
    color: var(--c2c-black);
    font-weight: 600;
  }
}

.page-content {
  min-height: 100vh;
  display: flex;
  flex-flow: column;
}

.home-topoguide {
  .page-content {
    padding-top: var(--c2c-navbar-height);
  }

  .ams-ad {
    margin-left: auto !important;
    padding-top: 0px !important;
  }
}

.nav-dfm {
  html,
  body,
  #app {
    min-height: calc(100vh - var(--c2c-navbarad-height));
  }

  .site-notice {
    top: var(--c2c-navbarad-height);
  }

  .page-content {
    padding-top: var(--c2c-navbarad-height);
  }
}

@media screen {
  [data-width='mobile'] {
    .side-menu {
      left: calc(-1 * var(--c2c-sidemenu-width));
    }

    .alternative-side-menu {
      left: 0;
    }

    .page-content,
    .ad {
      margin-left: 0;
    }
    .ad {
      padding-top: var(--c2c-navbar-height);
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
      left: calc(-1 * var(--c2c-sidemenu-width));
    }

    .alternative-side-menu {
      left: 0;
    }

    .page-content,
    .ad {
      margin-left: 0;
    }

    .ad {
      padding-top: var(--c2c-navbar-height);
    }
  }

  [data-width='desktop'] {
    .side-menu {
      left: 0;
    }
    .page-content,
    .ad {
      margin-left: var(--c2c-sidemenu-width);
    }

    .ad {
      padding-top: var(--c2c-navbar-height);
    }

    .site-notice {
      padding-left: var(--c2c-sidemenu-width);
    }
  }
}

.router-view {
  flex-grow: 1;
}

/* The phone layout of the app (data-shell, src/stores/app-settings.ts): fixed bars above and below the page, which
   take the offsets the navigation of the website took, with the side menu hidden. The page scrolls as the website's */
:root {
  --app-top-bar-height: calc(52px + env(safe-area-inset-top));
  /* 66 px: a lower bar kept the beta testers tapping Safari's address bar instead of the tabs */
  --app-bottom-bar-height: calc(66px + env(safe-area-inset-bottom));
}

/* the text size of the app settings, in both layouts: Bulma's base is 14px */
html[data-text-size='small'] {
  font-size: 12px;
}
html[data-text-size='large'] {
  font-size: 18px;
}

html[data-shell='mobile'] {
  /* pulling the top of the page refreshes what it shows (PullToRefresh.vue), not the whole page as the browser would */
  overscroll-behavior-y: contain;

  .side-menu,
  .navigation,
  .alternative-side-menu-shader {
    display: none !important;
  }

  .page-content {
    margin-left: 0;
    padding-bottom: var(--app-bottom-bar-height);
  }

  .ad {
    margin-left: 0;
    padding-top: var(--app-top-bar-height);
  }

  .home-topoguide .page-content,
  .nav-dfm .page-content {
    padding-top: var(--app-top-bar-height);
  }

  .site-notice {
    top: var(--app-top-bar-height);
    padding-left: 0;
  }

  /* the wide tables of the website (recent changes, associations history) scroll in their place, not the page */
  .section table {
    display: block;
    max-width: 100%;
    overflow-x: auto;
  }
}

/* The dark theme of the app (app settings, src/stores/app-settings.ts), in both layouts: the surfaces of Bulma and of the
   website turn dark, the orange and blue accents stay. The components of the app have their own dark rules.
   html[data-theme='dark'] out-specifies the scoped rules (.class[data-v-xxx]) of the components */
html[data-theme='dark'] {
  /* index.html colors the body inline, for the first paint before the styles */
  body {
    background-color: #1a1a1a !important;
  }
  body,
  .page-content {
    background: #1a1a1a;
    color: #f0f0f0;
  }

  /* cards: the rows of the cards hardcode Bulma's $text color, which disappears on a dark card */
  .card {
    background: #2a2a2a;
    color: #f0f0f0;
    border-color: rgba(255, 255, 255, 0.08);
  }
  /* the pressed state of a card is near white on the website */
  .card:hover,
  .card:focus,
  .card:active,
  .card.is-highlighted {
    background: #353535;
    color: #f5f5f5;
  }
  .card div,
  .card p,
  .card span,
  .card
    a:not(.button):not(.tag):not(.has-text-primary):not(.has-text-info):not(.has-text-link):not(.has-text-success):not(
      .has-text-warning
    ):not(.has-text-danger) {
    color: #f0f0f0;
  }
  .card .has-text-grey,
  .card .has-text-grey-light,
  .card .has-text-grey-dark {
    color: #c5c5c5 !important;
  }
  .card-content,
  .card-header,
  .card-footer {
    background: transparent;
  }
  .card-footer {
    border-top-color: rgba(255, 255, 255, 0.08);
  }
  .card-footer-item {
    border-right-color: rgba(255, 255, 255, 0.08);
  }

  .box {
    background: #2a2a2a;
    color: #e5e5e5;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.06);
  }

  /* text and background helpers of Bulma, a few stops lighter so the dim labels read on dark cards */
  .has-text-grey-darker,
  .has-text-grey-dark,
  .has-text-dark,
  .has-text-black {
    color: #f0f0f0 !important;
  }
  .has-text-grey {
    color: #c5c5c5 !important;
  }
  .has-text-grey-light {
    color: #a0a0a0 !important;
  }
  .has-text-info,
  .has-text-link {
    color: #6db4ff;
  }
  .has-background-light,
  .has-background-white {
    background-color: #2a2a2a !important;
  }

  .tag:not(.is-primary):not(.is-info):not(.is-success):not(.is-warning):not(.is-danger) {
    background: #3a3a3a;
    color: #e5e5e5;
  }

  .notification {
    background: #2f2f2f;
    color: #e5e5e5;
  }
  .notification.is-info {
    background: #1e3a5f;
    color: #d8e6f5;
  }
  .notification.is-warning {
    background: #5a4a1f;
    color: #f5e8c8;
  }
  .notification.is-danger {
    background: #5a2222;
    color: #f5d6d6;
  }

  .title {
    color: #f5f5f5;
  }
  .subtitle {
    color: #b5b5b5;
  }

  /* Bulma's bold text and table headings ($text-strong), and the helpers of the site set to $text: the color of the
     text around them, light */
  strong,
  .content table th {
    color: inherit;
  }
  .has-text-normal,
  .card-icon {
    color: #e5e5e5;
  }

  /* the boxes of the home page (DashboardXxx, ForumWidget, UsefulLinks) force $color-text on their links, and stripe
     their rows light */
  .home-topoguide .box {
    h4 > a,
    h6 > a,
    li > a,
    .outing-date-header > a,
    .forum-row {
      color: #e5e5e5 !important;
    }
    .dashboard-list > a:nth-child(2n + 1) {
      background: #303030;
    }
  }

  /* the tabs of My topos, and the light tags of Bulma */
  .tabs.is-boxed li.is-active a {
    background-color: #2a2a2a;
    border-color: rgba(255, 255, 255, 0.15);
    border-bottom-color: transparent;
    color: #f5f5f5;
  }
  .tabs.is-boxed a:hover {
    background-color: #2a2a2a;
  }
  .tag.is-success.is-light {
    background-color: #1f3d26;
    color: #a6e3b0;
  }

  /* the striped tables (history of a document), and the icon of a field being typed in ($grey-dark) */
  .table.is-striped tbody tr:not(.is-selected):nth-child(even) {
    background-color: #303030;
  }
  .table a:not(.button):not(.tag) {
    color: #6db4ff;
  }
  .control.has-icons-left,
  .control.has-icons-right {
    .input:focus ~ .icon,
    .select:focus ~ .icon {
      color: #e5e5e5;
    }
  }

  .input,
  .textarea,
  .select select {
    background: #1f1f1f;
    color: #e5e5e5;
    border-color: rgba(255, 255, 255, 0.15);
    &::placeholder {
      color: #6b6b6b;
    }
    &:focus {
      border-color: var(--c2c-color-base-c2c);
      box-shadow: 0 0 0 0.125em rgba(255, 153, 51, 0.25);
    }
  }
  .label {
    color: #e5e5e5;
  }
  .help {
    color: #9a9a9a;
  }

  /* only the plain buttons need a dark surface: the colored ones stand out on any background */
  .button:not(.is-primary):not(.is-info):not(.is-success):not(.is-warning):not(.is-danger):not(.is-link):not(
      .c2c-color
    ) {
    background: #2a2a2a;
    color: #e5e5e5;
    border-color: rgba(255, 255, 255, 0.15);
    &:hover,
    &:focus {
      background: #353535;
      color: #fff;
      border-color: rgba(255, 255, 255, 0.25);
    }
  }
  .button.is-text {
    background: transparent;
    &:hover,
    &:focus {
      background: rgba(255, 255, 255, 0.06);
    }
  }

  .dropdown-content {
    background: #2a2a2a;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  }
  .dropdown-item {
    color: #e5e5e5;
    &:hover,
    &.is-active {
      background: #3a3a3a;
      color: #fff;
    }
  }
  .dropdown-divider {
    background-color: rgba(255, 255, 255, 0.08);
  }

  .modal-card-head,
  .modal-card-foot {
    background: #232323;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .modal-card-body {
    background: #2a2a2a;
    color: #e5e5e5;
  }
  .modal-card-title {
    color: #f5f5f5;
  }
  .modal-background {
    background-color: rgba(0, 0, 0, 0.7);
  }

  .tabs a {
    color: #b5b5b5;
    border-bottom-color: rgba(255, 255, 255, 0.15);
  }
  .tabs li.is-active a {
    color: var(--c2c-color-base-c2c);
    border-bottom-color: var(--c2c-color-base-c2c);
  }

  table,
  .table {
    background: transparent;
    color: #e5e5e5;
  }
  .table th {
    background: #232323;
    color: #f5f5f5;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .table td {
    border-color: rgba(255, 255, 255, 0.06);
  }

  /* the list view of the documents (ag-grid), whose stylesheet has a fixed light palette */
  .ag-theme-balham {
    --ag-background-color: #2a2a2a;
    --ag-header-background-color: #232323;
    --ag-odd-row-background-color: #2a2a2a;
    --ag-foreground-color: #e5e5e5;
    --ag-header-foreground-color: #f5f5f5;
    --ag-border-color: rgba(255, 255, 255, 0.08);
    --ag-row-hover-color: rgba(255, 255, 255, 0.05);
    --ag-secondary-foreground-color: #b5b5b5;
  }

  hr {
    background-color: rgba(255, 255, 255, 0.08);
  }

  /* the text of the documents, and its embedded figures (#fafafa blocks on the website) */
  .markdown-content {
    color: #e5e5e5;
    code,
    pre {
      background: #1a1a1a;
    }
    code {
      color: #ffd17a;
    }
    blockquote {
      border-left-color: rgba(255, 255, 255, 0.2);
      color: #b5b5b5;
    }
    figure[c2c\:role='embedded-figure'] {
      background: #2a2a2a;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    figure,
    figcaption {
      color: #d5d5d5;
    }
  }
  .content,
  .content p,
  .content li,
  .content blockquote {
    color: #e5e5e5;
  }
  .content h1,
  .content h2,
  .content h3,
  .content h4,
  .content h5,
  .content h6 {
    color: #f5f5f5;
  }
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
