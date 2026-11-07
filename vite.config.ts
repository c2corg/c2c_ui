import { fileURLToPath, URL } from 'node:url';

import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';
import { visualizer } from 'rollup-plugin-visualizer';
import { type Plugin, type Rolldown, defineConfig } from 'vite';

/* Please note that all key present in this file are public keys
 * They don't need to be hidden.
 * If you need to use a private key, please do NOT add it here
 */

const urlsConfigurations: Record<string, UrlsConfiguration> = {
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
};

const config: BuildConfiguration = {
  routerMode: 'history', // for pretty urls
  ordnanceSurveyApiKey: 'eUaDulZ6AqXJo7iyoP2lRsgUjKfZWA71',
  isBackendSelectable: true,
  addthisPublicId: 'ra-58abf6b4f3a680cb',
  // Google Analytics 4 measurement ID (G-...). Universal Analytics (UA-2814179-1) stopped collecting in July 2024
  googleAnalyticsKey: '',
  urlsConfigurations,
  urls: urlsConfigurations.prod, // default: prod
  publicPath: '/', // set below
};

let base = '/';

// The oldest browsers to keep, for the JS (syntax target and polyfills) and the CSS: .browserslistrc (#4880). All
// support ES modules: no legacy (non ES module) bundle.
const browsers = browserslist.loadConfig({ path: '.' }) ?? [];
if (!browsers.length) {
  throw new Error('No browser targets: .browserslistrc not found');
}

// performance budgets, warnings only (as with webpack). Sizes are on minified files, not gzipped ones,
// hence the x4 (approx. gzip ratio on minified JS)
const budgets = {
  enabled: true,
  maxAssetSize: 300000 * 4,
  maxEntrypointSize: 500000 * 4,
};

let bundleReport = false;

if (process.env.BUILD_ENV === 'local' || process.env.BUILD_ENV === undefined) {
  // add an url conf for local API developers: the API runs on localhost:6543 unless told otherwise, with the same
  // variables as the Docker container (see docker/runtime-config.sh), e.g. C2C_API_URL=http://localhost:8080 npm run serve
  config.urlsConfigurations.localhost = {
    name: 'localhost',
    api: process.env.C2C_API_URL ?? 'http://localhost:6543',
    media: process.env.C2C_MEDIA_URL ?? 'https://sos-ch-dk-2.exo.io/c2corg-demov6-active',
    imageBackend: process.env.C2C_IMAGE_BACKEND_URL ?? 'https://images.demov6.camptocamp.org',
    forum: process.env.C2C_FORUM_URL ?? 'https://forum.demov6.camptocamp.org',
    modernThumbnailsTimestamp: 0,
    modernThumbnailsId: 0,
  };

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

  config.isBackendSelectable = false; // explicit flag
} else {
  throw new Error('Unknown BUILD_ENV');
}

config.publicPath = base;

const isBudgetChecked = (fileName: string) => !/\.(map|pdf)$/.test(fileName);

const outputSize = (output: Rolldown.OutputChunk | Rolldown.OutputAsset) =>
  Buffer.byteLength(output.type === 'chunk' ? output.code : output.source);

/**
 * Port of webpack performance hints: warns on too big assets, and too big entrypoint (entry chunk + static imports +
 * CSS)
 */
function performanceBudgets(): Plugin {
  return {
    name: 'c2c-performance-budgets',
    apply: 'build',
    // post: assets (images, fonts) are only added to the bundle by Vite's own generateBundle
    generateBundle: { order: 'post', handler: checkBudgets },
  };
}

function checkBudgets(
  this: Rolldown.PluginContext,
  _options: Rolldown.NormalizedOutputOptions,
  bundle: Rolldown.OutputBundle
) {
  const toKiB = (size: number) => `${(size / 1024).toFixed(0)} KiB`;

  const bigAssets = Object.values(bundle).filter(
    (output) => isBudgetChecked(output.fileName) && outputSize(output) > budgets.maxAssetSize
  );
  if (bigAssets.length) {
    this.warn(
      `asset size limit: the following asset(s) exceed the recommended size limit (${toKiB(budgets.maxAssetSize)}):\n` +
        bigAssets.map((output) => `  ${output.fileName} (${toKiB(outputSize(output))})`).join('\n')
    );
  }

  const entry = Object.values(bundle).find((output) => output.type === 'chunk' && output.isEntry)!;
  const files = new Set<string>();
  const visit = (fileName: string) => {
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

/** Injects the backend urls in index.html, which used to be an EJS template */
function htmlConfig(): Plugin {
  return {
    name: 'c2c-html-config',
    transformIndexHtml: {
      order: 'pre',
      handler: (html: string) =>
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
          // as the browser does, and as Vue 2 rendered: Vue 3's default (condense) drops spaces next to interpolations,
          // e.g. route ratings rendered "AD5c>5aII" instead of "AD 5c>5a II"
          whitespace: 'preserve',
          // no comments in dev either, as in production: a comment at the root of a template would make it a fragment,
          // which doesn't inherit the parent attributes (class, listeners)
          comments: false,
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
      modernTargets: browsers,
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
    alias: [{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }],
    // imports of .vue files without extension, as webpack allowed
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },

  css: {
    // Lightning CSS instead of PostCSS: vendor prefixes and syntax lowered for the browsers of .browserslistrc (as
    // autoprefixer did); build.cssMinify uses it too
    transformer: 'lightningcss',
    lightningcss: {
      targets: browserslistToTargets(browserslist(browsers)),
    },
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use '@/assets/sass/variables' as *;
          @use '@/assets/sass/mixins' as *;
        `,
      },
    },
  },

  html: {
    // replaced by a per-request nonce in docker/nginx.conf, see the Content-Security-Policy there
    cspNonce: '__CSP_NONCE__',
  },

  server: {
    port: 8080,
    strictPort: true,
  },

  build: {
    // build.target is derived from the browsers of .browserslistrc by plugin-legacy (modernTargets)
    sourcemap: true,
    // with the targets of css.lightningcss, not build.target
    cssMinify: 'lightningcss',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              // Dependencies needed at startup in a separate "vendor" chunk, as Vue CLI did with chunk-vendors: they
              // change less often than the app code, so they stay cached across releases. $initial: only the modules
              // statically imported by the entry, dependencies only reached through a dynamic import (ag-grid, d3...)
              // stay in their lazy chunks
              name: 'vendor',
              test: (id) => /[\\/]node_modules[\\/]/.test(id) && !/\.(css|scss|sass)($|\?)/.test(id),
              tags: ['$initial'],
            },
          ],
        },
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
