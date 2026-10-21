import { setDefaults as toastDefaults } from 'bulma-toast';
// eslint-disable-next-line import/no-unresolved
import { register as registerSwiper } from 'swiper/element';
import Vue from 'vue';

import App from '@/App.vue';
import config from '@/js/config';
import reloadOnStaleChunk from '@/js/reload-on-stale-chunk';
import analytics from '@/js/vue-plugins/analytics';
import dateUtils from '@/js/vue-plugins/date-utils';
import documentUtils from '@/js/vue-plugins/document-utils';
import filters from '@/js/vue-plugins/filters';
import fontAwesome from '@/js/vue-plugins/font-awesome-config';
import gdpr from '@/js/vue-plugins/gdpr';
import globalComponents from '@/js/vue-plugins/generic-components';
import getText from '@/js/vue-plugins/gettext-plugin';
import helperWindow from '@/js/vue-plugins/helper-window';
import imageViewer from '@/js/vue-plugins/image-viewer';
import router from '@/js/vue-plugins/router';
import screen from '@/js/vue-plugins/screen';
import user from '@/js/vue-plugins/user';

// Import the main Sass manifest file
import './assets/sass/main.scss';

reloadOnStaleChunk(router);

// web components
registerSwiper();
Vue.config.ignoredElements = [/^swiper/];

Vue.config.productionTip = false;
Vue.config.silent = false;

Vue.use(gdpr);
Vue.use(analytics, { id: config.googleAnalyticsKey, router }); // after $gdpr: follows the statistics choice

Vue.use(dateUtils); // date functions
Vue.use(documentUtils); // getDocumentType, getLocale functions
Vue.use(fontAwesome); // <fa-icon /> component
Vue.use(getText); // vm.$gettext() function and v-translate directive
Vue.use(helperWindow); // vm.$helper property
Vue.use(imageViewer);
Vue.use(globalComponents); // Components available everywhere
Vue.use(screen); // screen reactives properties
Vue.use(filters); // $filters.uppercaseFirstLetter(), $filters.stripMarkdown()
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
