import { fileURLToPath, URL } from 'node:url';

import legacy from '@vitejs/plugin-legacy';
// eslint-disable-next-line import/no-unresolved -- exports-only package, which eslint-plugin-import can't resolve
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

/* Please note that all key present in this file are public keys
 * They don't need to be hidden.
 * If you need to use a private key, please do NOT add it here
 */

const config = {
  routerMode: 'history', // for pretty urls
  bingApiKey: undefined,
  ordnanceSurveyApiKey: 'eUaDulZ6AqXJo7iyoP2lRsgUjKfZWA71',
  isBackendSelectable: true,
  addthisPublicId: 'ra-58abf6b4f3a680cb',
  // Google Analytics 4 measurement ID (G-...). Universal Analytics (UA-2814179-1) stopped collecting in July 2024
  googleAnalyticsKey: '',
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

let base = '/';

// The webpack build shipped untranspiled dependencies (OpenLayers uses ?. and ??), so ES2020 browsers
// were already the effective minimum: no legacy (non ES module) bundle is needed.
const modernBrowsers = ['chrome>=80', 'edge>=80', 'firefox>=74', 'safari>=13.1', 'ios>=13.4', 'samsung>=13'];

// performance budgets, warnings only (as with webpack). Sizes are on minified files, not gzipped ones,
// hence the x4 (approx. gzip ratio on minified JS)
const budgets = {
  enabled: true,
  maxAssetSize: 300000 * 4,
  maxEntrypointSize: 500000 * 4,
};

let bundleReport = false;

if (process.env.BUILD_ENV === 'local' || process.env.BUILD_ENV === undefined) {
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

  // dev bundles are huge, no check
  budgets.enabled = false;
} else if (process.env.BUILD_ENV === 'github') {
  // github pages does not support server redirection, can't use pretty urls
  config.routerMode = undefined;

  // github pages url is postfixed
  // and we will deploy a build on
  // https://c2corg.github.io/c2c_ui/<branch-name>/
  config.branchName = process.env.GITHUB_PAGES_BRANCH;
  base = `/c2c_ui/${config.branchName}/`;

  // generate a report on bundle size
  bundleReport = true;
} else if (process.env.BUILD_ENV === 'camptocamp') {
  config.urls = config.urlsConfigurations.prod;

  config.bingApiKey = 'AudizIfCd3NAdt91ubJMGkMI-swfHxe1R-_U7KiLxCHqepDy70txQ-_-89_eevxc';

  config.isBackendSelectable = false; // explicit flag
} else {
  throw new Error('Unknown BUILD_ENV');
}

config.publicPath = base;

const isBudgetChecked = (fileName) => !/\.(map|pdf)$/.test(fileName);

const outputSize = (output) => Buffer.byteLength(output.type === 'chunk' ? output.code : output.source);

/**
 * Port of webpack performance hints: warns on too big assets, and too big entrypoint (entry chunk + static imports +
 * CSS)
 */
function performanceBudgets() {
  return {
    name: 'c2c-performance-budgets',
    apply: 'build',
    // post: assets (images, fonts) are only added to the bundle by Vite's own generateBundle
    generateBundle: { order: 'post', handler: checkBudgets },
  };
}

function checkBudgets(options, bundle) {
  const toKiB = (size) => `${(size / 1024).toFixed(0)} KiB`;

  const bigAssets = Object.values(bundle).filter(
    (output) => isBudgetChecked(output.fileName) && outputSize(output) > budgets.maxAssetSize
  );
  if (bigAssets.length) {
    this.warn(
      `asset size limit: the following asset(s) exceed the recommended size limit (${toKiB(budgets.maxAssetSize)}):\n` +
        bigAssets.map((output) => `  ${output.fileName} (${toKiB(outputSize(output))})`).join('\n')
    );
  }

  const entry = Object.values(bundle).find((output) => output.type === 'chunk' && output.isEntry);
  const files = new Set();
  const visit = (fileName) => {
    if (files.has(fileName)) {
      return;
    }
    files.add(fileName);
    const output = bundle[fileName];
    if (output?.type === 'chunk') {
      output.imports.forEach(visit);
      output.viteMetadata?.importedCss.forEach((css) => files.add(css));
    }
  };
  visit(entry.fileName);

  const entrypointSize = [...files]
    .filter(isBudgetChecked)
    .reduce((total, fileName) => total + outputSize(bundle[fileName]), 0);
  if (entrypointSize > budgets.maxEntrypointSize) {
    this.warn(
      `entrypoint size limit: the entrypoint (${toKiB(entrypointSize)}) exceeds the recommended limit ` +
        `(${toKiB(budgets.maxEntrypointSize)}). This can impact web performance.`
    );
  }
}

/**
 * Puts dependencies needed at startup in a separate "vendor" chunk, as Vue CLI did with chunk-vendors: they change less
 * often than the app code, so they stay cached across releases. Dependencies only reached through a dynamic import
 * (ag-grid, d3...) stay in their lazy chunks.
 */
function vendorChunk() {
  const staticallyImportedByEntry = new Map();
  const isStaticallyImportedByEntry = (id, getModuleInfo, visiting = new Set()) => {
    if (staticallyImportedByEntry.has(id)) {
      return staticallyImportedByEntry.get(id);
    }
    if (visiting.has(id)) {
      return false; // import cycle, decided by another path
    }
    visiting.add(id);
    const info = getModuleInfo(id);
    const result =
      !!info &&
      (info.isEntry ||
        info.importers.some((importer) => isStaticallyImportedByEntry(importer, getModuleInfo, visiting)));
    staticallyImportedByEntry.set(id, result);
    return result;
  };

  return (id, { getModuleInfo }) => {
    if (
      id.includes('node_modules') &&
      !/\.(css|scss|sass)($|\?)/.test(id) &&
      isStaticallyImportedByEntry(id, getModuleInfo)
    ) {
      return 'vendor';
    }
  };
}

/** Injects the backend urls in index.html, which used to be an EJS template */
function htmlConfig() {
  return {
    name: 'c2c-html-config',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html
          .replaceAll('%CAMPTOCAMP_API_URL%', config.urls.api)
          .replaceAll('%CAMPTOCAMP_MEDIA_URL%', config.urls.media),
    },
  };
}

export default defineConfig({
  base,

  define: {
    CAMPTOCAMP_CONFIG: JSON.stringify(config),
  },

  plugins: [
    vue({
      template: {
        compilerOptions: {
          whitespace: 'preserve',
          // Vue 3 with the Vue 2 behaviours (@vue/compat): each one warns, to be migrated one by one
          compatConfig: { MODE: 2 },
          // web components
          isCustomElement: (tag) => tag.startsWith('swiper-'),
        },
      },
    }),
    htmlConfig(),
    // No legacy bundle: only usage-based core-js polyfills, as babel did for Vue CLI
    legacy({
      renderLegacyChunks: false,
      modernPolyfills: true,
      modernTargets: modernBrowsers,
    }),
    budgets.enabled && performanceBudgets(),
    bundleReport &&
      visualizer({
        filename: 'dist/bundle-analyzis.html',
        template: 'treemap',
        gzipSize: true,
      }),
  ],

  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // the migration build: Vue 3 with a Vue 2 compatible API (@vue/compat), for the app and its dependencies
      { find: /^vue$/, replacement: '@vue/compat' },
    ],
    // imports of .vue files without extension, as webpack allowed
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },

  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import '@/assets/sass/variables.scss';
          @import '@/assets/sass/mixins.scss';
        `,
      },
    },
  },

  server: {
    port: 8080,
    strictPort: true,
  },

  build: {
    // build.target is derived from modernBrowsers by plugin-legacy
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: vendorChunk(),
      },
    },
    // translations, wiki tools... are lazy loaded: never preload them. Vite only preloads the
    // static imports of a dynamic chunk when it is requested, so nothing to disable here.
    // sizes are checked by the performanceBudgets plugin, on every asset and not only JS chunks
    chunkSizeWarningLimit: Infinity,
    // Vue CLI never inlined SVG files, and some are used with a fragment (levels-danger.svg#level1)
    assetsInlineLimit: (filePath) => (filePath.endsWith('.svg') ? false : undefined),
  },
});
