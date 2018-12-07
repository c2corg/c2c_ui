const webpack = require('webpack')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const result = {
    baseUrl: '/',

    // remove prefetch plugin, in order to prevent loading of translations
    // https://github.com/vuejs/vue-cli/issues/979#issuecomment-373310338
    chainWebpack(config) {
        config.plugins.delete('prefetch')
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
            maxAssetSize: 250000 * 4,

            // and we allow a entry point of 450 kb gzipped
            maxEntrypointSize: 450000 * 4
        },

        plugins: [
            // moment, by default load all locales
            // this will skip all of it, and a fixed list is setted in @/tools/vue-moment.js',
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
        ]
    }
}

const config = {
    routerMode: 'history', // for pretty urls
    ignApiKey: undefined,
    bingApiKey: undefined,
    isProduction: false,
    urlsConfigurations: {
        demo: {
            name: 'demo',
            api: 'https://api.demov6.camptocamp.org',
            media: 'https://sos.exo.io/c2corg-demov6-active',
            imageBackend: 'https://images.demov6.camptocamp.org',
            forum: 'https://forum.demov6.camptocamp.org',
            readWrite: true
        },
        prod: {
            name: 'prod',
            api: 'https://api.camptocamp.org',
            media: 'https://media.camptocamp.org/c2corg_active',
            imageBackend: 'https://images.camptocamp.org',
            forum: 'https://forum.camptocamp.org',
            readWrite: false // conservative approach : you have to explicity set it to true
        }
    }
}

config.urls = config.urlsConfigurations.demo // conservative default : demo

const bundleAnalyzerConfig = {
    analyzerMode: 'disabled',
    openAnalyzer: false
}

if (process.env.BUILD_ENV === 'local' || process.env.BUILD_ENV === undefined) {
    config.ignApiKey = 'hzuh5yjuto8lqbqs2njo0che' // Key valid for localhost (Expires 08/11/2019)
    config.bingApiKey = 'ApgmUK6zfKqlvU9kNDbXeLFL2KvhC0BF3Jy-nUbcnkFJK_Y7UgMCyRq1NTu_ptyj'

    // dev bundles are huge, no check
    result.configureWebpack.performance.hints = false
} else if (process.env.BUILD_ENV === 'gitlab') {
    // gitlab pages does not support server redirection, can't use pretty urls
    config.routerMode = undefined

    // gitlab pages url is postfixed
    result.baseUrl = '/vue-camptocamp/'

    // set a warning if bundle size is too big
    result.configureWebpack.performance.hints = 'warning'

    // generate a report on bundle size
    bundleAnalyzerConfig.analyzerMode = 'static'
    bundleAnalyzerConfig.reportFilename = 'bundle-analyzis.html'
    bundleAnalyzerConfig.defaultSizes = 'gzip'
} else if (process.env.BUILD_ENV === 'camptocamp') {
    config.urls = config.urlsConfigurations.prod
    config.isProduction = true // explicit prod flag
    config.urls.readWrite = true // explicit read-write mode in prod
} else {
    throw new Error('Unknown BUILD_ENV')
}

result.configureWebpack.plugins.push(
    new BundleAnalyzerPlugin(bundleAnalyzerConfig)
)

result.configureWebpack.plugins.push(
    new webpack.DefinePlugin({
        CAMPTOCAMP_CONFIG: JSON.stringify(config)
    })
)

module.exports = result
