const webpack = require('webpack');

const result = {
    baseUrl: null,

    configureWebpack: {
        plugins: [
            // moment, by default load all localesca
            // this will skip all of it, and a fixed list is setted in main.',
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
                }
            })
        ],
    }
}

if(process.env.NODE_ENV == 'development'){
    result.baseUrl = "/"
}

else if(process.env.NODE_ENV == 'demo_gitlab'){
    result.baseUrl = "/vue-camptocamp/"
}

else if(process.env.NODE_ENV == 'production'){
    result.baseUrl = "/"
}

else
    throw "Unknown ENV. Please use --mode <node_env> with vue-cli-service build command"

module.exports = result
