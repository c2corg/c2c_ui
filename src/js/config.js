var devConfig = {
    apiUrl : "https://api.demov6.camptocamp.org",
    mediaUrl : "https://media.camptocamp.org/c2corg_active",
    forumUrl : "https://forum.demov6.camptocamp.org",
    router_mode : undefined, // 'history' for pretty urls
}

var prodConfig = {
    apiUrl : "https://api.camptocamp.org",
    mediaUrl : "https://media.camptocamp.org/c2corg_active",
    forumUrl : "https://forum.camptocamp.org",
    router_mode : undefined, // 'history' for pretty urls
}

var isDev = false;

export default isDev ? devConfig : prodConfig;
