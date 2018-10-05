const webpack = require('webpack');

var config = {}

// TODO document this
if(process.env.BUILD_ENV == 'development' || process.env.BUILD_ENV === undefined){
    config.baseUrl = "/"

    config.apiUrl = "https://api.demov6.camptocamp.org"
    config.mediaUrl = "https://media.camptocamp.org/c2corg_active"
    config.imageBackendUrl = "https://images.demov6.camptocamp.org"
    config.forumUrl = "https://forum.demov6.camptocamp.org"
    config.router_mode = 'history'
    config.ignApiKey = 'x216cgugvwkn0go20sm2mgar' // Key valid for localhost (expires 19/09/2016)
    config.bingApiKey = 'ApgmUK6zfKqlvU9kNDbXeLFL2KvhC0BF3Jy-nUbcnkFJK_Y7UgMCyRq1NTu_ptyj'
}
else if(process.env.BUILD_ENV == 'demo_gitlab'){
    config.baseUrl = "/vue-camptocamp/"

    config.apiUrl = "https://api.demov6.camptocamp.org"
    config.mediaUrl = "https://media.camptocamp.org/c2corg_active"
    config.imageBackendUrl = "https://images.demov6.camptocamp.org"
    config.forumUrl = "https://forum.demov6.camptocamp.org"
    // gitlab pages does not support server redirection, can't use pretty urls
    config.router_mode = undefined
    config.ignApiKey = undefined
    config.bingApiKey = undefined
}
else if(process.env.BUILD_ENV == 'production'){
    config.baseUrl = "/"

    config.apiUrl = "https://api.camptocamp.org"
    config.mediaUrl = "https://media.camptocamp.org/c2corg_active"
    config.imageBackendUrl = "http://images.camptocamp.org"
    config.forumUrl = "https://forum.camptocamp.org"
    config.router_mode = 'history' // for pretty urls
    config.ignApiKey = undefined
    config.bingApiKey = undefined
}
else {
    throw "Unknown BUILD_ENV"
}

const result = {
    baseUrl: config.baseUrl,

    configureWebpack: {
        plugins: [
            // moment, by default load all localesca
            // this will skip all of it, and a fixed list is setted in main.',
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
            new webpack.DefinePlugin({
                CAMPTOCAMP_CONFIG:  JSON.stringify(config)
            })
        ],
    }
}

module.exports = result
