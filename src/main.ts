import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from '@/App.vue';
import config from '@/js/config';
import reloadOnStaleChunk from '@/js/reload-on-stale-chunk';
import analytics from '@/js/vue-plugins/analytics';
import appSettings from '@/js/vue-plugins/app-settings';
import dateUtils from '@/js/vue-plugins/date-utils';
import documentUtils from '@/js/vue-plugins/document-utils';
import filters from '@/js/vue-plugins/filters';
import fontAwesome from '@/js/vue-plugins/font-awesome-config';
import gdpr from '@/js/vue-plugins/gdpr';
import globalComponents from '@/js/vue-plugins/generic-components';
import getText from '@/js/vue-plugins/gettext-plugin';
import helperWindow from '@/js/vue-plugins/helper-window';
import imageViewer from '@/js/vue-plugins/image-viewer';
import router, { addAuthenticationGuard } from '@/js/vue-plugins/router';
import screen from '@/js/vue-plugins/screen';
import user from '@/js/vue-plugins/user';
import registerServiceWorker from '@/pwa/register-service-worker';

// the global styles, in this order: the design tokens (custom properties) the styles use, the scrollbars and the
// external links, Bulma (the main Sass manifest file), checkboxes, radios and switches, the helpers of the site and the
// width of the icons
import './assets/css/tokens.css';
import './assets/css/scrollbar.css';
import './assets/css/external-links.css';
import './assets/css/bulma/index.css';
import './assets/css/checkradio.css';
import './assets/css/switch.css';
import './assets/css/toast.css';
import './assets/css/helpers.css';
import './assets/css/fontawesome.css';

reloadOnStaleChunk(router);

const app = createApp(App);

app.use(createPinia()); // the stores (src/stores)
app.use(appSettings); // $appSettings: theme, text size and layout of this device, on <html> before the first render
app.use(gdpr);
app.use(analytics, { id: config.googleAnalyticsKey, router }); // after $gdpr: follows the statistics choice
app.use(dateUtils); // date functions
app.use(documentUtils); // getDocumentType, getLocale functions
app.use(fontAwesome); // <fa-icon /> component
app.use(getText); // vm.$gettext() function and v-translate directive
app.use(helperWindow); // vm.$helper property
app.use(imageViewer);
app.use(globalComponents); // Components available everywhere
app.use(screen); // screen reactives properties
app.use(filters); // $filters.uppercaseFirstLetter(), $filters.stripMarkdown()
app.use(user); // vm.$user property

// installing the router starts the first navigation: guards first
addAuthenticationGuard(app.config.globalProperties.$user);
app.use(router);

app.config.globalProperties.$language.firstLoad();
app.mount('#app-mount');

registerServiceWorker(router);
