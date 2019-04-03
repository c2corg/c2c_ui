const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const result = {
  publicPath: '/',

  // remove prefetch plugin, in order to prevent loading of translations
  // https://github.com/vuejs/vue-cli/issues/979#issuecomment-373310338
  chainWebpack(config) {
    config.plugins.delete('prefetch');
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
      }
    },

    plugins: [
      // moment, by default load all locales
      // this will skip all of it, and a fixed list is setted in @/tools/vue-moment.js',
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ]
  }
};

/* Please not that all key present in this file are public keys
 * They don't need to be hidden.
 * If you need to use a private key, please do NOT add it here
 */

const config = {
  routerMode: 'history', // for pretty urls
  ignApiKey: 'iq1rkryayi4z074da39pbg6s',
  bingApiKey: 'AudizIfCd3NAdt91ubJMGkMI-swfHxe1R-_U7KiLxCHqepDy70txQ-_-89_eevxc',
  isProduction: false,
  addthisPublicId: 'ra-58abf6b4f3a680cb',
  googleAnalyticsKey: 'UA-2814179-1',
  urlsConfigurations: {
    demo: {
      name: 'demo',
      api: 'https://api.demov6.camptocamp.org',
      media: 'https://sos.exo.io/c2corg-demov6-active',
      imageBackend: 'https://images.demov6.camptocamp.org',
      forum: 'https://forum.demov6.camptocamp.org',
      recaptchaKey: '6LfWUwoUAAAAAAxud1qqok6wOJJlCUsYXxHizRhc'
    },
    prod: {
      name: 'prod',
      api: 'https://api.camptocamp.org',
      media: 'https://media.camptocamp.org/c2corg_active',
      imageBackend: 'https://images.camptocamp.org',
      forum: 'https://forum.camptocamp.org',
      recaptchaKey: '6Lc9Cw4UAAAAAIKnlar0AOsGX_P5S-bk9u8viuo2'
    }
  }
};

config.urls = config.urlsConfigurations.prod; // default : prod

const bundleAnalyzerConfig = {
  analyzerMode: 'disabled',
  openAnalyzer: false
};

if (process.env.BUILD_ENV === 'local' || process.env.BUILD_ENV === undefined) {
  // add an url conf for local API devloppers :
  config.urlsConfigurations['localhost'] = {
    name: 'localhost',
    api: 'http://localhost:6543',
    media: 'https://sos.exo.io/c2corg-demov6-active',
    imageBackend: 'https://images.demov6.camptocamp.org',
    forum: 'https://forum.demov6.camptocamp.org'
  };

  config.ignApiKey = 'hzuh5yjuto8lqbqs2njo0che'; // Key valid for localhost (Expires 08/11/2019)
  config.bingApiKey = 'ApgmUK6zfKqlvU9kNDbXeLFL2KvhC0BF3Jy-nUbcnkFJK_Y7UgMCyRq1NTu_ptyj';

  // dev bundles are huge, no check
  result.configureWebpack.performance.hints = false;

  // add map for debbuging tools
  result.configureWebpack.devtool = 'source-map';
} else if (process.env.BUILD_ENV === 'github') {
  // github pages does not support server redirection, can't use pretty urls
  config.routerMode = undefined;

  // github pages url is postfixed
  result.publicPath = '/c2c_ui/';

  // set a warning if bundle size is too big
  result.configureWebpack.performance.hints = 'warning';

  // generate a report on bundle size
  bundleAnalyzerConfig.analyzerMode = 'static';
  bundleAnalyzerConfig.reportFilename = 'bundle-analyzis.html';
  bundleAnalyzerConfig.defaultSizes = 'gzip';
} else if (process.env.BUILD_ENV === 'camptocamp') {
  config.urls = config.urlsConfigurations.prod;
  config.isProduction = true; // explicit prod flag
  // set a warning if bundle size is too big
  result.configureWebpack.performance.hints = 'warning';
} else {
  throw new Error('Unknown BUILD_ENV');
}

config.publicPath = result.publicPath;

result.configureWebpack.plugins.push(
  new BundleAnalyzerPlugin(bundleAnalyzerConfig)
);

result.configureWebpack.plugins.push(
  new webpack.DefinePlugin({
    CAMPTOCAMP_CONFIG: JSON.stringify(config)
  })
);

module.exports = result;
