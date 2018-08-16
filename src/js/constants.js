
import common from '@/js/common.js'

common.documentType = {
    a:"area",
    c:"article",
    b:"book",
    i:"image",
    m:"map",
    o:"outing",
    r:"route",
    u:"profile",
    w:"waypoint",
    x:"xreport"
}

common.documentsGeoLocalization = [
    "routes",
    "waypoints",
    "profiles",
    "outings",
    "images",
    "xreports"
]

common.activities = common.attributes.activities
common.langs = common.attributes.langs

common.localeFields = {
    route:[
        {name:"summary"},
        {name:"route_history", label:"History"},
        {name:"description"},
        {name:"slackline_anchor1", activity:'slacklining'},
        {name:"slackline_anchor2", activity:'slacklining'},
        {name:"remarks"},
        {name:"gear"},
        {name:"external_resources", label:"External resources"},
    ]
}


common.getDocumentType = function(type){
    return type.length == 1 ? common.documentType[type] : type
}

export default common
