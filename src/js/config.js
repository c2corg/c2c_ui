var devConfig = {
    apiUrl : "https://api.demov6.camptocamp.org",
    mediaUrl : "https://media.camptocamp.org/c2corg_active",
    forumUrl : "https://forum.demov6.camptocamp.org",
}

var prodConfig = {
    apiUrl : "https://api.camptocamp.org",
    mediaUrl : "https://media.camptocamp.org/c2corg_active",
    forumUrl : "https://forum.camptocamp.org",
}

var useProd = false

export default (useProd ? devConfig : prodConfig)
