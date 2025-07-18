const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const result = {
  publicPath: '/',

  css: {
    sourceMap: true,
    loaderOptions: {
      sass: {
        additionalData: `
          @import '@/assets/sass/variables.scss';
          @import '@/assets/sass/mixins.scss';
        `,
      },
    },
  },

  productionSourceMap: true,

  chainWebpack(config) {
    // remove prefetch plugin, in order to prevent loading of translations
    // https://github.com/vuejs/vue-cli/issues/979#issuecomment-373310338
    config.plugins.delete('prefetch');

    // preserveWhitespace option was set to false by default in vue-cli v4
    // https://cli.vuejs.org/migrating-from-v3/#vue-cli-service
    // cutomize options
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap((options) => {
        // modify the options...
        delete options.compilerOptions.preserveWhitespace;
        options.compilerOptions.whitespace = 'condensed';
        return options;
      });

    // also handle avif format
    config.module.rule('images').test(/\.(png|jpe?g|gif|webp|avif)(\?.*)?$/);
  },

  configureWebpack: {
    performance: {
      hints: 'error',
      // TODO sizes checks are on compiled files, instead of GZIP sizes
      // PR is ready on Webpack side :
      //     https://github.com/webpack/webpack/pull/7910
      //
      // And here is THE option :
      //
      // compress:true,
      //
      // But they did not merge it....
      // waiting this, we increase the limit by 4
      // approx the decrease Gzip ratio on a .js minified files
      maxAssetSize: 300000 * 4,

      // and we allow a entry point of 450 kb gzipped
      maxEntrypointSize: 500000 * 4,

      assetFilter(assetFilename) {
        if (/\.map$/.test(assetFilename)) {
          return false;
        }

        if (/\.pdf$/.test(assetFilename)) {
          return false;
        }

        return true;
      },
    },

    plugins: [],
  },
};

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
  googleAnalyticsKey: 'UA-2814179-1',
  urlsConfigurations: {
    demo: {
      name: 'demo',
      api: 'https://preprod.c2c.preprod0.smart-origin.com/api',
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
      api: 'https://preprod.c2c.preprod0.smart-origin.com/api',
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

config.urls = config.urlsConfigurations.localhost; // default: prod

const bundleAnalyzerConfig = {
  analyzerMode: 'disabled',
  openAnalyzer: false,
};

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
  result.configureWebpack.performance.hints = false;

  // add map for debbuging tools
  result.configureWebpack.devtool = 'source-map';
} else if (process.env.BUILD_ENV === 'github') {
  // github pages does not support server redirection, can't use pretty urls
  config.routerMode = undefined;

  // github pages url is postfixed
  // and we will deploy a build on
  // https://c2corg.github.io/c2c_ui/<branch-name>/
  config.branchName = process.env.GITHUB_PAGES_BRANCH;
  result.publicPath = `/c2c_ui/${config.branchName}/`;

  // set a warning if bundle size is too big
  result.configureWebpack.performance.hints = 'warning';

  // generate a report on bundle size
  bundleAnalyzerConfig.analyzerMode = 'static';
  bundleAnalyzerConfig.reportFilename = 'bundle-analyzis.html';
  bundleAnalyzerConfig.defaultSizes = 'gzip';
} else if (process.env.BUILD_ENV === 'camptocamp') {
  config.urls = config.urlsConfigurations.prod;

  config.bingApiKey = 'AudizIfCd3NAdt91ubJMGkMI-swfHxe1R-_U7KiLxCHqepDy70txQ-_-89_eevxc';

  config.isBackendSelectable = false; // explicit flag

  // set a warning if bundle size is too big
  result.configureWebpack.performance.hints = 'warning';
} else {
  throw new Error('Unknown BUILD_ENV');
}

config.publicPath = result.publicPath;

result.configureWebpack.plugins.push(new BundleAnalyzerPlugin(bundleAnalyzerConfig));

result.configureWebpack.plugins.push(
  new webpack.DefinePlugin({
    CAMPTOCAMP_CONFIG: JSON.stringify(config),
  })
);

module.exports = result;
