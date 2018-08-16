
import common from '@/js/common.js'

console.log(common)

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

common.getDocumentType = function(type){
    return type.length == 1 ? common.documentType[type] : type
}

export default common
