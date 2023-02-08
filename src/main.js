import { setDefaults as toastDefaults } from 'bulma-toast';
// eslint-disable-next-line import/no-unresolved
import { register as registerSwiper } from 'swiper/element/bundle';
import Vue from 'vue';
import VueAnalytics from 'vue-analytics';
import VueHead from 'vue-head';

import App from '@/App.vue';
import config from '@/js/config';
import dateUtils from '@/js/vue-plugins/date-utils';
import documentUtils from '@/js/vue-plugins/document-utils';
import fontAwesome from '@/js/vue-plugins/font-awesome-config';
import gdpr from '@/js/vue-plugins/gdpr';
import globalComponents from '@/js/vue-plugins/generic-components';
import getText from '@/js/vue-plugins/gettext-plugin';
import helperWindow from '@/js/vue-plugins/helper-window';
import imageViewer from '@/js/vue-plugins/image-viewer';
import localStorage from '@/js/vue-plugins/local-storage';
import router from '@/js/vue-plugins/router';
import screen from '@/js/vue-plugins/screen';
import stripMarkdown from '@/js/vue-plugins/strip-markdown';
import upperCaseFirstLetter from '@/js/vue-plugins/uppercase-first-letter';
import user from '@/js/vue-plugins/user';

// Require the main Sass manifest file
require('./assets/sass/main.scss');

// web components
registerSwiper();
Vue.config.ignoredElements = [/^swiper/];

Vue.config.productionTip = false;
Vue.config.silent = false;

Vue.use(localStorage); // First, vm.$localStorage property

Vue.use(gdpr);
Vue.use(VueAnalytics, {
  id: config.googleAnalyticsKey,
  disabled: true,
  beforeFirstHit() {
    if (Vue.prototype.$gdpr.gdprValue?.statistics) {
      Vue.prototype.$ga.enable();
    }
  },
  router,
  autoTracking: {
    // do not send updates if query parameter has changed
    // note that skipSamePath does not do the job, as document's titles is part of route
    // https://github.com/MatteoGabriele/vue-analytics/blob/master/docs/page-tracking.md#customize-router-updates
    shouldRouterUpdate(to, from) {
      return to.name !== from.name || String(to.params.id) !== String(from.params.id);
    },
    pageviewTemplate(route) {
      return {
        page: route.path,
        title: 'Camptocamp.org',
        location: window.location.href,
      };
    },
  },
  set: [{ field: 'anonymizeIp', value: true }],
  fields: {
    cookieDomain: window.location.host === 'localhost:8080' ? 'none' : window.location.host,
  },
});
Vue.use(VueHead);

Vue.use(dateUtils); // date functions
Vue.use(documentUtils); // getDocumentType, getLocale functions
Vue.use(fontAwesome); // <fa-icon /> component
Vue.use(getText); // vm.$gettext() function and v-translate directive
Vue.use(helperWindow); // vm.$helper property
Vue.use(imageViewer);
Vue.use(globalComponents); // Components available everywhere
Vue.use(screen); // screen reactives properties
Vue.use(stripMarkdown); // stripMarkdown filter
Vue.use(upperCaseFirstLetter); // upperCaseFirstLetter filter
Vue.use(user); // vm.$user property

new Vue({
  router,
  created() {
    this.$language.firstLoad();
  },
  render: (h) => h(App),
}).$mount('#app');

// configure toast defaults
toastDefaults({
  duration: 3000,
  pauseOnHover: true,
});
