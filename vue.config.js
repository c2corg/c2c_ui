const webpack = require('webpack');

module.exports = {
    baseUrl: process.env.NODE_ENV === 'production'  ? '/vue-camptocamp/' : '/',

    configureWebpack: {
        plugins: [
            // moment, by default load all localesca            // this will skip all of it, and a fixed list is setted in main.',
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        ],
    }
}
