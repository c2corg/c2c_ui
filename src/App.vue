<template>
  <div
    id="app"
    :class="{
      'nav-dfm': !homePage && !$screen.isMobile && !$screen.isTablet && !$screen.isDesktop,
      'home-topoguide': homePage,
    }"
  >
    <environment-banner />
    <side-menu class="side-menu no-print" />
    <navigation class="navigation no-print" />
    <dfm-ad-small v-if="!homePage && ($screen.isMobile || $screen.isTablet || $screen.isDesktop)" class="ad" />
    <site-notice class="no-print site-notice" />
    <image-viewer v-if="imageViewerRequested" />
    <helper-window />
    <alert-window />

    <!-- the phone layout of the app (under DESKTOP_BREAKPOINT): a top bar and a bottom tab bar instead of the side menu and the navigation -->
    <mobile-top-bar v-if="appSettings.isMobileShell" />
    <mobile-menu v-if="appSettings.isMobileShell" />

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
import { defineAsyncComponent, onMounted, ref, watch } from 'vue';

import AlertWindow from './components/alert-window/AlertWindow.vue';
import BottomNav from './components/app/BottomNav.vue';
import MobileMenu from './components/app/MobileMenu.vue';
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

onMounted(() => {
  document.getElementById('splashscreen')!.style.display = 'none';
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
  left: 0;
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
  --c2c-header-height: var(--c2c-navbarad-height);

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

/* The navigation of the site follows html[data-shell] (src/stores/app-settings.ts), set from DESKTOP_BREAKPOINT: from it,
   the side menu is open and the page leaves room for it; under it, the phone layout hides them (below) */
@media screen {
  html[data-shell='desktop'] {
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

/* the narrow content of the phones (a width, not the navigation) */
@media screen and (max-width: 769px) {
  .section {
    padding: 0.75rem !important;
  }

  .box:not(:last-child),
  .feed-card {
    margin-bottom: 0.75rem !important;
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

  /* the colors of the app the design tokens (tokens.css) have no token for, prefixed --app- to stay out of their list:
     the roles of the components of the app (a surface, the bars, a border...), which the dark theme redefines below,
     and the shades of the dark theme */
  --app-surface: var(--c2c-white);
  --app-bar: var(--c2c-white);
  --app-border: rgba(0, 0, 0, 0.12);
  --app-hover: rgba(0, 0, 0, 0.05);
  --app-text-muted: #6b6b6b;
  --app-accent-background: #fff5e6;
  --app-dark-background: #1a1a1a;
  --app-dark-field: #1f1f1f;
  --app-dark-surface-sunken: #232323;
  --app-dark-surface: #2a2a2a;
  --app-dark-surface-hover: #353535;
  --app-dark-surface-raised: #3a3a3a;
  --app-dark-text: #e5e5e5;
  --app-dark-text-strong: #f0f0f0;
  --app-dark-text-muted: #9a9a9a;
  --app-dark-border: rgba(255, 255, 255, 0.15);
  --app-dark-border-light: rgba(255, 255, 255, 0.08);
  --app-dark-accent-background: #3a2f1a;
  --app-dark-link: #6db4ff;
}

/* the text size of the app settings, in both layouts: Bulma's base is 14px */
html[data-text-size='small'] {
  font-size: 12px;
}
html[data-text-size='large'] {
  font-size: 18px;
}

html[data-shell='mobile'] {
  /* their offsets (listing header, pinned map) follow our top bar, whose height does not follow the text size */
  --c2c-navbar-height: var(--app-top-bar-height);
  /* pulling the top of the page refreshes what it shows (PullToRefresh.vue), not the whole page as the browser would */
  overscroll-behavior-y: contain;

  .side-menu,
  .navigation {
    display: none !important;
  }

  .page-content {
    padding-bottom: var(--app-bottom-bar-height);
  }

  .ad {
    padding-top: var(--app-top-bar-height);
  }

  .home-topoguide .page-content,
  .nav-dfm .page-content {
    padding-top: var(--app-top-bar-height);
  }

  .site-notice {
    top: var(--app-top-bar-height);
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
  /* The dark theme redefines the design tokens (tokens.css, c2corg/c2c_ui#4907): what uses them turns dark by itself,
     Bulma's CSS and the components alike. --c2c-white stays white: it is the background of the surfaces (cards, boxes,
     inputs...) but also the text on the colored ones (buttons of the maps, Yeti, Itinévert...), which must stay white.
     The white surfaces get their dark background below. */
  --c2c-body-background-color: var(--app-dark-background);
  --c2c-text: var(--app-dark-text);
  --c2c-color-text: var(--app-dark-text);
  --c2c-grey-darker: var(--app-dark-text-strong);
  --c2c-grey-dark: #c5c5c5;
  --c2c-white-ter: var(--app-dark-surface-hover);
  --c2c-grey-lightest: var(--app-dark-border-light);
  --c2c-grey-lighter: var(--app-dark-border);
  --c2c-hover-background: var(--app-dark-surface-hover);
  --c2c-input-placeholder-color: #7a7a7a;
  --c2c-primary-light: #1e3a5f;
  --c2c-card-border: 1px solid var(--app-dark-border-light);
  /* and the roles of the components of the app */
  --app-surface: var(--app-dark-surface);
  --app-bar: var(--app-dark-surface-sunken);
  --app-border: rgba(255, 255, 255, 0.12);
  --app-hover: rgba(255, 255, 255, 0.06);
  --app-text-muted: var(--app-dark-text-muted);
  --app-accent-background: var(--app-dark-accent-background);

  /* the orange buttons of the site (c2c-color, "Join" in the navigation): their text stays dark, as on the light theme */
  .button.c2c-color,
  .button.c2c-color a {
    color: hsl(0, 0%, 21%);
  }

  /* the attribution and the scale line sit on the map, which stays light: their text stays dark */
  .ol-attribution ul,
  .ol-scale-line {
    --ol-foreground-color: hsl(0, 0%, 21%);
  }

  /* index.html colors the body inline, for the first paint before the styles */
  body {
    background-color: var(--app-dark-background) !important;
  }
  body,
  .page-content {
    background: var(--app-dark-background);
    color: var(--app-dark-text-strong);
  }

  /* cards: the rows of the cards hardcode Bulma's $text color, which disappears on a dark card */
  .card {
    background: var(--app-dark-surface);
    color: var(--app-dark-text-strong);
    border-color: var(--app-dark-border-light);
  }
  /* the pressed state of a card is near white on the website */
  .card:hover,
  .card:focus,
  .card:active,
  .card.is-highlighted {
    background: var(--app-dark-surface-hover);
    color: var(--app-dark-text-strong);
  }
  .card div,
  .card p,
  .card span,
  .card
    a:not(.button):not(.tag):not(.has-text-primary):not(.has-text-info):not(.has-text-link):not(.has-text-success):not(
      .has-text-warning
    ):not(.has-text-danger) {
    color: var(--app-dark-text-strong);
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
    border-top-color: var(--app-dark-border-light);
  }
  .card-footer-item {
    border-right-color: var(--app-dark-border-light);
  }

  .box {
    background: var(--app-dark-surface);
    color: var(--app-dark-text);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.06);
  }

  /* text and background helpers of Bulma, a few stops lighter so the dim labels read on dark cards */
  .has-text-grey-darker,
  .has-text-grey-dark,
  .has-text-dark,
  .has-text-black {
    color: var(--app-dark-text-strong) !important;
  }
  .has-text-grey {
    color: #c5c5c5 !important;
  }
  .has-text-grey-light {
    color: #a0a0a0 !important;
  }
  .has-text-info,
  .has-text-link {
    color: var(--app-dark-link);
  }
  .has-background-light,
  .has-background-white {
    background-color: var(--app-dark-surface) !important;
  }

  /* the plain and light tags: --c2c-light, their light palette, is not a token the dark theme changes */
  .tag:not(.is-primary):not(.is-info):not(.is-success):not(.is-warning):not(.is-danger) {
    background: var(--app-dark-surface-raised);
    color: var(--app-dark-text);
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

  .subtitle {
    color: var(--c2c-grey-light);
  }

  .has-text-normal,
  .card-icon {
    color: var(--app-dark-text);
  }

  /* the boxes of the home page (DashboardXxx, ForumWidget, UsefulLinks) force $color-text on their links, and stripe
     their rows light */
  .home-topoguide .box {
    h4 > a,
    h6 > a,
    li > a,
    .outing-date-header > a,
    .forum-row {
      color: var(--app-dark-text) !important;
    }
    .dashboard-list > a:nth-child(2n + 1) {
      background: #303030;
    }
  }

  /* the tabs of My topos, and the light tags of Bulma */
  .tabs.is-boxed li.is-active a {
    background-color: var(--app-dark-surface);
    border-color: var(--app-dark-border);
    border-bottom-color: transparent;
    color: var(--app-dark-text-strong);
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
    color: var(--app-dark-link);
  }
  .control.has-icons-left,
  .control.has-icons-right {
    .input:focus ~ .icon,
    .select:focus ~ .icon {
      color: var(--app-dark-text);
    }
  }

  .input,
  .textarea,
  .select select {
    background: var(--app-dark-field);
    &:focus {
      border-color: var(--c2c-color-base-c2c);
      box-shadow: 0 0 0 0.125em rgba(255, 153, 51, 0.25);
    }
  }
  .help {
    color: var(--app-dark-text-muted);
  }

  /* only the plain buttons need a dark surface: the colored ones stand out on any background */
  .button:not(.is-primary):not(.is-info):not(.is-success):not(.is-warning):not(.is-danger):not(.is-link):not(
      .c2c-color
    ) {
    background: var(--app-dark-surface);
    color: var(--app-dark-text);
    border-color: var(--app-dark-border);
    &:hover,
    &:focus {
      background: var(--app-dark-surface-hover);
      color: var(--c2c-white);
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
    background: var(--app-dark-surface);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  }
  .dropdown-item {
    color: var(--app-dark-text);
    &:hover,
    &.is-active {
      background: var(--app-dark-surface-raised);
      color: var(--c2c-white);
    }
  }

  .modal-card-head,
  .modal-card-foot {
    background: var(--app-dark-surface-sunken);
    border-color: var(--app-dark-border-light);
  }
  .modal-card-body {
    background: var(--app-dark-surface);
    color: var(--app-dark-text);
  }
  .modal-background {
    background-color: rgba(0, 0, 0, 0.7);
  }

  .tabs a {
    color: var(--c2c-grey-light);
    border-bottom-color: var(--app-dark-border);
  }
  .tabs li.is-active a {
    color: var(--c2c-color-base-c2c);
    border-bottom-color: var(--c2c-color-base-c2c);
  }

  table,
  .table {
    background: transparent;
    color: var(--app-dark-text);
  }
  .table th {
    background: var(--app-dark-surface-sunken);
    color: var(--app-dark-text-strong);
    border-color: var(--app-dark-border-light);
  }
  .table td {
    border-color: rgba(255, 255, 255, 0.06);
  }

  /* the list view of the documents (ag-grid), whose stylesheet has a fixed light palette */
  .ag-theme-balham {
    --ag-background-color: var(--app-dark-surface);
    --ag-header-background-color: var(--app-dark-surface-sunken);
    --ag-odd-row-background-color: var(--app-dark-surface);
    --ag-foreground-color: var(--app-dark-text);
    --ag-header-foreground-color: var(--app-dark-text-strong);
    --ag-border-color: var(--app-dark-border-light);
    --ag-row-hover-color: rgba(255, 255, 255, 0.05);
    --ag-secondary-foreground-color: var(--c2c-grey-light);
  }

  /* the text of the documents, and its embedded figures (#fafafa blocks on the website) */
  .markdown-content {
    color: var(--app-dark-text);
    code,
    pre {
      background: var(--app-dark-background);
    }
    code {
      color: #ffd17a;
    }
    blockquote {
      border-left-color: rgba(255, 255, 255, 0.2);
      color: var(--c2c-grey-light);
    }
    figure[c2c\:role='embedded-figure'] {
      background: var(--app-dark-surface);
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
    color: var(--app-dark-text);
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
