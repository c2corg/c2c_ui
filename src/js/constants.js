const documentType = {
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


export default {
    documentType,

    getDocumentType(type){
        return type.length == 1 ? documentType[type] : type
    },

    documentsGeoLocalization: [
        "routes",
        "waypoints",
        "profiles",
        "outings",
        "images",
        "xreports"
    ],

    activities: [
        'skitouring',
        'snow_ice_mixed',
        'mountain_climbing',
        'rock_climbing',
        'ice_climbing',
        'hiking',
        'snowshoeing',
        'paragliding',
        'mountain_biking',
        'via_ferrata',
        'slacklining'
    ],

    langs: ['fr', 'en', 'it', 'de', 'es', 'ca', 'eu']
}
