import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  type RouteComponent,
  type RouteRecordRaw,
} from 'vue-router';

import config from '@/js/config';
import constants, { type DocumentDefinition } from '@/js/constants';
import { once } from '@/js/event-bus';
import AreaView from '@/views/document/AreaView.vue';
import ArticleView from '@/views/document/ArticleView.vue';
import BookView from '@/views/document/BookView.vue';
import ImageView from '@/views/document/ImageView.vue';
import MapView from '@/views/document/MapView.vue';
import OutingView from '@/views/document/OutingView.vue';
import ProfileView from '@/views/document/ProfileView.vue';
import RouteView from '@/views/document/RouteView.vue';
import WaypointView from '@/views/document/WaypointView.vue';
import XreportView from '@/views/document/XreportView.vue';
import DocumentsPrintingView from '@/views/documents/DocumentsPrintingView.vue';
import DocumentsView from '@/views/documents/DocumentsView.vue';
import HomeView from '@/views/portals/HomeView.vue';
import ItinevertView from '@/views/portals/ItinevertView.vue';
import SophiePictureContestView from '@/views/portals/SophiePictureContestView.vue';
import OutingsStatsView from '@/views/portals/outings-stats/OutingsStatsView.vue';
import NotFoundView from '@/views/static-views/NotFoundView.vue';
import SeracView from '@/views/static-views/SeracView.vue';
import TopoguideView from '@/views/static-views/TopoguideView.vue';
import AccountView from '@/views/user/AccountView.vue';
import FollowingView from '@/views/user/FollowingView.vue';
import LoginView from '@/views/user/LoginView.vue';
import PreferencesView from '@/views/user/PreferencesView.vue';
import TrackersExchangeTokenView from '@/views/user/TrackersExchangeTokenView.vue';
import TrackersView from '@/views/user/TrackersView.vue';

// lazy-load components
// actually, only diff is quite big, because of diff computation
// but lets group together this three views.
const AreaEditionView = () => import('@/views/wiki/edition/AreaEditionView.vue');
const ArticleEditionView = () => import('@/views/wiki/edition/ArticleEditionView.vue');
const BookEditionView = () => import('@/views/wiki/edition/BookEditionView.vue');
const ImageEditionView = () => import('@/views/wiki/edition/ImageEditionView.vue');
const MapEditionView = () => import('@/views/wiki/edition/MapEditionView.vue');
const OutingEditionView = () => import('@/views/wiki/edition/OutingEditionView.vue');
const ProfileEditionView = () => import('@/views/wiki/edition/ProfileEditionView.vue');
const RouteEditionView = () => import('@/views/wiki/edition/RouteEditionView.vue');
const WaypointEditionView = () => import('@/views/wiki/edition/WaypointEditionView.vue');
const XreportEditionView = () => import('@/views/wiki/edition/XreportEditionView.vue');
const WhatsNewView = () => import(`@/views/wiki/WhatsNewView.vue`);
const HistoryView = () => import(`@/views/wiki/HistoryView.vue`);
const AssociationsHistoryView = () => import(`@/views/wiki/AssociationsHistoryView.vue`);
const DiffView = () => import(`@/views/wiki/DiffView.vue`);
const YetiView = () => import(`@/views/portals/YetiView.vue`);

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/topoguide', name: 'topoguide', component: TopoguideView },
  { path: '/itinevert', name: 'itinevert', component: ItinevertView },
  { path: '/serac', name: 'serac', component: SeracView },
  { path: '/whatsnew', name: 'whatsnew', component: WhatsNewView },
  { path: '/associations-history', name: 'associations-history', component: AssociationsHistoryView },
  { path: '/auth', name: 'auth', component: LoginView },
  { path: '/auth-sso', name: 'auth-sso', component: LoginView },
  { path: '/account', name: 'account', component: AccountView, meta: { requiresAuth: true } },
  { path: '/following', name: 'following', component: FollowingView, meta: { requiresAuth: true } },
  { path: '/preferences', name: 'preferences', component: PreferencesView, meta: { requiresAuth: true } },
  { path: '/trackers', name: 'trackers', component: TrackersView, meta: { requiresAuth: true } },
  {
    path: '/trackers/:vendor/exchange-token',
    name: 'trackers-exchange-token',
    component: TrackersExchangeTokenView,
    meta: { requiresAuth: true },
  },
  { path: '/yeti/:document_id(\\d+)?/:page?', name: 'yeti', component: YetiView },
  { path: '/outings-stats', name: 'outings-stats', component: OutingsStatsView },
  { path: '/sophie-picture-contest/:year(\\d+)?', name: 'sophie-picture-contest', component: SophiePictureContestView },

  // leaves the UI for the forum before any component is needed: vue-router's types want one on every route
  {
    path: '/forum',
    name: 'forum',
    beforeEnter() {
      location.href = config.urls.forum;
    },
  } as unknown as RouteRecordRaw,
];

// a component of a route, or the function lazy loading it
type Component = RouteComponent | (() => Promise<RouteComponent>);

const addDocumentTypeView = function (def: DocumentDefinition, viewComponent: Component, editionComponent: Component) {
  routes.push({
    path: '/' + def.documentType + 's',
    name: def.documentType + 's',
    component: DocumentsView,
  });

  routes.push({
    path: '/' + def.documentType + 's/print',
    name: def.documentType + 's-print',
    component: DocumentsPrintingView,
  });

  routes.push({
    path: '/' + def.documentType + 's/:id(\\d+)/:lang?/:title?',
    name: def.documentType,
    component: viewComponent,
  });

  routes.push({
    path: '/' + def.documentType + 's/version/:id(\\d+)/:lang/:version',
    name: def.documentType + '-version',
    component: viewComponent,
  });

  routes.push({
    path: '/' + def.documentType + 's/history/:id(\\d+)/:lang',
    name: def.documentType + '-history',
    component: HistoryView,
  });

  routes.push({
    path: '/' + def.documentType + 's/edit/:id(\\d+)/:lang',
    name: def.documentType + '-edit',
    component: editionComponent,
    meta: { requiresAuth: true },
  });

  routes.push({
    path: '/' + def.documentType + 's/add/:lang',
    name: def.documentType + '-add',
    component: editionComponent,
    meta: { requiresAuth: true },
  });

  routes.push({
    path: '/' + def.documentType + 's/diff/:id(\\d+)/:lang/:versionFrom/:versionTo',
    name: def.documentType + '-diff',
    component: DiffView,
  });
};

addDocumentTypeView(constants.objectDefinitions.area, AreaView, AreaEditionView);
addDocumentTypeView(constants.objectDefinitions.article, ArticleView, ArticleEditionView);
addDocumentTypeView(constants.objectDefinitions.book, BookView, BookEditionView);
addDocumentTypeView(constants.objectDefinitions.image, ImageView, ImageEditionView);
addDocumentTypeView(constants.objectDefinitions.map, MapView, MapEditionView);
addDocumentTypeView(constants.objectDefinitions.outing, OutingView, OutingEditionView);
addDocumentTypeView(constants.objectDefinitions.profile, ProfileView, ProfileEditionView);
addDocumentTypeView(constants.objectDefinitions.route, RouteView, RouteEditionView);
addDocumentTypeView(constants.objectDefinitions.waypoint, WaypointView, WaypointEditionView);
addDocumentTypeView(constants.objectDefinitions.xreport, XreportView, XreportEditionView);

routes.push({ path: '/:pathMatch(.*)*', name: '404', component: NotFoundView });

// removes the trigger-scroll handler of the last navigation that waits for its view's data
let cancelPendingScroll: (() => void) | null = null;

const router = createRouter({
  routes,
  history: config.routerMode === 'history' ? createWebHistory(import.meta.env.BASE_URL) : createWebHashHistory(),

  scrollBehavior(to, from, savedPosition) {
    // https://router.vuejs.org/guide/advanced/scroll-behavior.html#scroll-behavior
    // and
    // https://github.com/vuejs/vue-router/blob/dev/examples/scroll-behavior/app.js

    // the previous page left before its view triggered the scroll: forget its position, or the next view to trigger
    // the scroll would get it
    if (cancelPendingScroll) {
      cancelPendingScroll();
      cancelPendingScroll = null;
    }

    let position: ScrollToOptions = {};

    if (to.hash) {
      // actually, scroll behavior is not fired at initial load
      // so let useDocumentView() (views/document/utils/document-view.ts) handle hash use case, as it's the
      // only use case for a new-born tab
      // See https://github.com/vuejs/vue-router/issues/2358

      // when it will be fixed, remove scrollToHash function, and simply replace the return by this two lines :

      //   position.selector = to.hash;
      //   position.offset = { y: 50 }; // navbar height

      return false;
    } else if (savedPosition) {
      position = savedPosition;
    } else {
      // don't need to wait any data, scroll to top
      return { left: 0, top: 0 };
    }

    // we'll wait for trigger-scroll event
    return new Promise((resolve) => {
      // we add an once handler on the event
      // view will trigger it once data are present
      cancelPendingScroll = once('trigger-scroll', () => {
        cancelPendingScroll = null;
        resolve(position);
      });
    });
  },
});

// authentication guard. $user is installed on the app after the router is created: main.js adds it, before the
// router starts the first navigation
export function addAuthenticationGuard(user: { readonly isLogged: boolean }) {
  router.beforeEach((to) => {
    if (to.matched.some((record) => record.meta.requiresAuth) && !user.isLogged) {
      return { name: 'auth', query: { redirect: to.fullPath } };
    }
  });
}

export default router;
