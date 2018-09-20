const webpack = require('webpack');

module.exports = {
    baseUrl: process.env.NODE_ENV === 'production'  ? '/vue-camptocamp/' : '/',

    configureWebpack: {
        plugins: [
            // moment, by default load all locales.
            // this will skip all of it, and a fixed list is setted in main.js
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        ],
    }
}
