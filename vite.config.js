import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

const srcDir = fileURLToPath(new URL('./src', import.meta.url)).replace(/\\/g, '/');

/* Please note that all key present in this object are public keys
 * They don't need to be hidden.
 * If you need to use a private key, please do NOT add it here
 */
const config = {
  routerMode: 'history', // for pretty urls
  bingApiKey: undefined,
  ordnanceSurveyApiKey: 'eUaDulZ6AqXJo7iyoP2lRsgUjKfZWA71',
  isBackendSelectable: true,
  addthisPublicId: 'ra-58abf6b4f3a680cb',
  // GA4 measurement id (format G-XXXXXXXXXX) - fill in once the GA4 property is created.
  // Universal Analytics (former googleAnalyticsKey) was shut down by Google in July 2023.
  googleAnalyticsMeasurementId: undefined,
  urlsConfigurations: {
    demo: {
      name: 'demo',
      api: 'https://api.demov6.camptocamp.org',
      media: 'https://sos-ch-dk-2.exo.io/c2corg-demov6-active',
      imageBackend: 'https://images.demov6.camptocamp.org',
      tracking: 'https://tracking.demov6.camptocamp.org',
      miniatures: 'https://sos-ch-dk-2.exo.io/c2corg-demov6-tracking',
      forum: 'https://forum.demov6.camptocamp.org',
      recaptchaKey: '6LfWUwoUAAAAAAxud1qqok6wOJJlCUsYXxHizRhc',
      modernThumbnailsTimestamp: 0,
      modernThumbnailsId: 0,
      stravaConnectAuthUrl: 'https://www.strava.com/oauth/authorize',
      stravaClientId: '99246',
      decathlonConnectAuthUrl: 'https://api-global.decathlon.net/connect/oauth/authorize',
      decathlonClientId: 'b708af3b-fd46-41ab-af73-5176a0a56f92',
      suuntoConnectAuthUrl: 'https://cloudapi-oauth.suunto.com/oauth/authorize',
      suuntoClientId: '2928e564-85eb-4aef-92fb-2a0259589c9c',
      polarConnectAuthUrl: 'https://flow.polar.com/oauth2/authorization',
      polarClientId: '65d10592-5abf-41d6-a5ce-b16a28174849',
      corosConnectAuthUrl: 'https://opentest.coros.com/oauth2/authorize',
      corosClientId: 'f263ed9257c74e808befaf548a27852c',
    },
    prod: {
      name: 'prod',
      api: 'https://api.camptocamp.org',
      media: 'https://media.camptocamp.org/c2corg-active',
      imageBackend: 'https://images.camptocamp.org',
      tracking: 'https://tracking.camptocamp.org',
      miniatures: 'https://media.camptocamp.org/c2corg-tracking',
      forum: 'https://forum.camptocamp.org',
      recaptchaKey: '6Lc9Cw4UAAAAAIKnlar0AOsGX_P5S-bk9u8viuo2',
      modernThumbnailsTimestamp: 0,
      modernThumbnailsId: 0,
      stravaConnectAuthUrl: 'https://www.strava.com/oauth/authorize',
      stravaClientId: '63968',
      decathlonConnectAuthUrl: 'https://api-global.decathlon.net/connect/oauth/authorize',
      decathlonClientId: 'b708af3b-fd46-41ab-af73-5176a0a56f92',
      suuntoConnectAuthUrl: 'https://cloudapi-oauth.suunto.com/oauth/authorize',
      suuntoClientId: '2928e564-85eb-4aef-92fb-2a0259589c9c',
      polarConnectAuthUrl: 'https://flow.polar.com/oauth2/authorization',
      polarClientId: '5a9f9ddd-fc15-48d2-bc56-86b43d491cc9',
      corosConnectAuthUrl: 'https://open.coros.com/oauth2/authorize',
      corosClientId: 'f263ed9257c74e808befaf548a27852c',
    },
    localhost: {
      name: 'localhost',
      api: 'http://localhost:6543',
      media: 'https://sos-ch-dk-2.exo.io/c2corg-demov6-active',
      imageBackend: 'https://images.demov6.camptocamp.org',
      forum: 'https://forum.demov6.camptocamp.org',
      modernThumbnailsTimestamp: 0,
      modernThumbnailsId: 0,
    },
  },
};

config.urls = config.urlsConfigurations.prod; // default: prod

const buildEnv = process.env.BUILD_ENV;

let base = '/';

// Substitutes %CAMPTOCAMP_API_URL%/%CAMPTOCAMP_MEDIA_URL% placeholders in index.html
// (Vite only substitutes %BASE_URL% natively).
const htmlConfigPlaceholders = {
  name: 'html-config-placeholders',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html
        .replace(/%CAMPTOCAMP_API_URL%/g, config.urls.api)
        .replace(/%CAMPTOCAMP_MEDIA_URL%/g, config.urls.media);
    },
  },
};

const plugins = [vue(), htmlConfigPlaceholders];

if (buildEnv === 'local' || buildEnv === undefined) {
  // add an url conf for local API developers:
  config.urlsConfigurations.localhost = {
    name: 'localhost',
    api: 'http://localhost:6543',
    media: 'https://sos-ch-dk-2.exo.io/c2corg-demov6-active',
    imageBackend: 'https://images.demov6.camptocamp.org',
    forum: 'https://forum.demov6.camptocamp.org',
    modernThumbnailsTimestamp: 0,
    modernThumbnailsId: 0,
  };

  config.bingApiKey = 'ApgmUK6zfKqlvU9kNDbXeLFL2KvhC0BF3Jy-nUbcnkFJK_Y7UgMCyRq1NTu_ptyj';
} else if (buildEnv === 'github') {
  // github pages does not support server redirection, can't use pretty urls
  config.routerMode = undefined;

  // github pages url is postfixed
  // and we will deploy a build on
  // https://c2corg.github.io/c2c_ui/<branch-name>/
  config.branchName = process.env.GITHUB_PAGES_BRANCH;
  base = `/c2c_ui/${config.branchName}/`;

  // generate a report on bundle size
  plugins.push(
    visualizer({
      filename: 'dist/bundle-analyzis.html',
      open: false,
      gzipSize: true,
    })
  );
} else if (buildEnv === 'camptocamp') {
  config.urls = config.urlsConfigurations.prod;

  config.bingApiKey = 'AudizIfCd3NAdt91ubJMGkMI-swfHxe1R-_U7KiLxCHqepDy70txQ-_-89_eevxc';

  config.isBackendSelectable = false; // explicit flag
} else {
  throw new Error('Unknown BUILD_ENV');
}

config.publicPath = base;

export default defineConfig({
  base,

  plugins,

  resolve: {
    alias: {
      '@': srcDir,
    },
    // this codebase's .vue imports are almost all extensionless (relied on vue-cli's
    // webpack config, which included .vue here by default).
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },

  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: `
          @import "${srcDir}/assets/sass/variables.scss";
          @import "${srcDir}/assets/sass/mixins.scss";
        `,
      },
    },
  },

  define: {
    CAMPTOCAMP_CONFIG: JSON.stringify(config),
  },

  server: {
    port: 8080,
    host: true,
  },

  build: {
    sourcemap: true,
  },
});
