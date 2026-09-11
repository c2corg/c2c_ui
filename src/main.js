import { createHead } from '@unhead/vue/client';
import { setDefaults as toastDefaults } from 'bulma-toast';
// eslint-disable-next-line import/no-unresolved
import { register as registerSwiper } from 'swiper/element';
import { createApp } from 'vue';
import { addGtag, createGtag, optOut as optOutGtag } from 'vue-gtag';

import App from '@/App.vue';
import config from '@/js/config';
import createAppRouter from '@/js/vue-plugins/router';
import dateUtils from '@/js/vue-plugins/date-utils';
import documentUtils from '@/js/vue-plugins/document-utils';
import fontAwesome from '@/js/vue-plugins/font-awesome-config';
import gdpr from '@/js/vue-plugins/gdpr';
import globalComponents from '@/js/vue-plugins/generic-components';
import getText from '@/js/vue-plugins/gettext-plugin';
import helperWindow, { setRootVm as setHelperRootVm } from '@/js/vue-plugins/helper-window';
import imageViewer, { setRootVm as setImageViewerRootVm } from '@/js/vue-plugins/image-viewer';
import localStorage from '@/js/vue-plugins/local-storage';
import screen from '@/js/vue-plugins/screen';
import stripMarkdown from '@/js/vue-plugins/strip-markdown';
import upperCaseFirstLetter from '@/js/vue-plugins/uppercase-first-letter';
import user from '@/js/vue-plugins/user';

// Require the main Sass manifest file
import './assets/sass/main.scss';

const app = createApp(App);

// web components
registerSwiper();
app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('swiper');

const router = createAppRouter(app);

app.use(localStorage); // First, vm.$localStorage property

app.use(gdpr);

// GA4 (former Universal Analytics tracking was shut down by Google in July 2023).
// googleAnalyticsMeasurementId is a placeholder until a real GA4 property is created;
// initMode: 'manual' keeps it inert (no script loaded, nothing tracked) until $ga.enable()
// is called (see gdpr.js), matching the previous GDPR-gated behavior.
const installGtag = createGtag({
  tagId: config.googleAnalyticsMeasurementId,
  initMode: 'manual',
  config: {
    cookie_domain: window.location.host === 'localhost:8080' ? 'none' : window.location.host,
  },
  pageTracker: {
    router,
  },
});
installGtag(app);
app.config.globalProperties.$ga = {
  enable() {
    addGtag();
  },
  disable() {
    optOutGtag();
  },
};

app.use(createHead());

app.use(dateUtils); // date functions
app.use(documentUtils); // getDocumentType, getLocale functions
app.use(fontAwesome); // <fa-icon /> component
app.use(getText); // vm.$gettext() function and v-translate directive
app.use(helperWindow); // vm.$helper property
app.use(imageViewer);
app.use(globalComponents); // Components available everywhere
app.use(screen); // screen reactives properties
app.use(stripMarkdown); // stripMarkdown method
app.use(upperCaseFirstLetter); // upperCaseFirstLetter method
app.use(user); // vm.$user property

app.use(router);

const vm = app.mount('#app');
setHelperRootVm(vm);
setImageViewerRootVm(vm);

app.config.globalProperties.$language.firstLoad();

// configure toast defaults
toastDefaults({
  duration: 3000,
  pauseOnHover: true,
});
