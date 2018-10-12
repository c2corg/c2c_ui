
import common from '@/js/common.js'


/* shorthand helpers */
const attrs = common.attributes;

//shorthand for true only properties (missing prop means false)
const required=true;
const disabled=true;
const multiple=true;


//small helper for shorter code
const no_paragliding_or_slacklining = [
    "hiking",
    "rock_climbing",
    "via_ferrata",
    "snow_ice_mixed",
    "mountain_biking",
    "mountain_climbing",
    "ice_climbing",
    "snowshoeing",
    "skitouring"
]

const only_paragliding = ["paragliding_landing", "paragliding_takeoff"];
const only_slackline = ["slackline_spot"];
const only_climbing = ["climbing_indoor", "climbing_outdoor"];

const getFieldsObject  = function(){
    var result = {}

    for(let item of arguments){
        result[item.name] = item
    }

    return result
}

//TODO : geom, longlat, condiction_levels

const fieldsProperties = {
    access:{type:"markdown", parent:"locales"},
    access_comment:{type:"markdown", parent:"locales"},
    access_condition:{values:attrs.access_conditions},
    access_period:{type:"markdown", parent:"locales"},
    access_time:{values:attrs.access_times},
    activities:{values:attrs.activities, multiple, required, queryMode:"activities"},
    activity_rate:{values:attrs.activity_rates},
    age:{type:"number", min:0, max:120, units:"years"},
    aid_rating:{values:attrs.aid_ratings, queryMode:"valuesRangeSlider", i18n:false},
    anonymous:{type:"boolean"},
    area_type:{values:attrs.area_types, required},
    article_categories:{name:"categories", values:attrs.article_categories, multiple, required},
    article_type:{values:attrs.article_types, required},
    author:{minLength:2, i18n:false},
    author_status:{values:attrs.author_statuses},
    autonomy:{values:attrs.autonomies},
    avalanche_level:{values:attrs.avalanche_levels},
    avalanche_signs:{values:attrs.avalanche_signs, multiple},
    avalanche_slope:{values:attrs.avalanche_slopes},
    avalanches:{type:"markdown", parent:"locales"},
    best_periods:{values:attrs.months, multiple},
    blanket_unstaffed:{values:[true, false, null]},
    book_types:{values:attrs.book_types, multiple, required},
    camera_name:{type:"text"},
    capacity:{type:"number", min:0, max:9999},
    capacity_staffed:{type:"number", min:0, max:9999},
    categories:{values:attrs.user_categories, multiple},
    children_proof:{values:attrs.children_proof_types},
    climbing_indoor_types:{values:attrs.climbing_indoor_types, multiple},
    climbing_outdoor_type:{values:attrs.climbing_outdoor_types},
    climbing_outdoor_types:{values:attrs.climbing_outdoor_types, multiple},
    climbing_rating_max:{values:attrs.climbing_ratings, i18n:false},
    climbing_rating_median:{values:attrs.climbing_ratings, i18n:false},
    climbing_rating_min:{values:attrs.climbing_ratings, i18n:false},
    climbing_styles:{values:attrs.climbing_styles, multiple},
    code:{type:"text"},
    condition_rating:{values:attrs.condition_ratings, queryMode:"valuesRangeSlider"},
    conditions:{type:"markdown", parent:"locales"},
    configuration:{values:attrs.route_configuration_types, multiple},
    custodianship:{values:attrs.custodianship_types},
    date:{type:"date"},
    date_end:{type:"date"},
    date_start:{type:"date", required},
    date_time:{type:"date_time"}, // wasn't in common... //TODO : max:today
    description:{type:"markdown", parent:"locales"},
    difficulties_height:{type:"number", min:0, max:9999, unit:"m"},
    disable_comments:{type:"boolean"},
    durations:{values:attrs.route_duration_types, multiple, i18n:false},
    editor:{minLength:2},
    elevation:{type:"number", min:0, max:9999, unit:"m"},
    elevation_access:{type:"number", min:0, max:9999, unit:"m"},
    elevation_down_snow:{type:"number", min:0, max:9999, unit:"m"},
    elevation_max:{type:"number", min:0, max:9999, unit:"m"},
    elevation_min:{type:"number", min:0, max:9999, unit:"m"},
    elevation_up_snow:{type:"number", min:0, max:9999, unit:"m"},
    engagement_rating:{values:attrs.engagement_ratings, queryMode:"valuesRangeSlider", i18n:false},
    equipment_rating:{values:attrs.equipment_ratings, queryMode:"valuesRangeSlider", i18n:false},
    equipment_ratings:{values:attrs.equipment_ratings, multiple, i18n:false}, // for waypoints
    event_type:{values:attrs.event_types, multiple},
    exposition_rating:{values:attrs.exposition_ratings, queryMode:"valuesRangeSlider", i18n:false},
    exposition_rock_rating:{values:attrs.exposition_rock_ratings, queryMode:"valuesRangeSlider", i18n:false},
    exposure_time:{type:"number",min:0, max:0, unit:"ms"},
    external_resources:{type:"markdown", parent:"locales"},
    file_size:{type:"number",disabled},
    filename:{type:"text", disabled},
    fnumber:{type:"text"},
    focal_length:{type:"number",min:1, unit:"mm"},
    frequentation:{values:attrs.frequentation_types},
    gas_unstaffed:{values:[true, false, null]},
    gear:{type:"markdown", parent:"locales"},
    gender:{values:attrs.genders},
    glacier_gear:{values:attrs.glacier_gear_types},
    glacier_rating:{values:attrs.glacier_ratings, queryMode:"valuesRangeSlider"},
    global_rating:{values:attrs.global_ratings, queryMode:"valuesRangeSlider", i18n:false},
    ground_types:{values:attrs.ground_types, multiple},
    group_management:{type:"markdown", parent:"locales"},
    heating_unstaffed:{values:[true, false, null]},
    height:{type:"number", disabled},
    height_diff_access:{type:"number", min:0, max:3000, unit:"m"},
    height_diff_difficulties:{type:"number", min:0, max:3000, unit:"m"},
    height_diff_down:{type:"number", min:0, max:9999, unit:"m"},
    height_diff_up:{type:"number", min:0, max:9999, unit:"m"},
    height_max:{type:"number", min:0, max:9999, unit:"m"},
    height_median:{type:"number", min:0, max:9999, unit:"m"},
    height_min:{type:"number", min:0, max:9999, unit:"m"},
    hiking_mtb_exposition:{values:attrs.exposition_ratings, queryMode:"valuesRangeSlider", i18n:false},
    hiking_rating:{values:attrs.hiking_ratings, queryMode:"valuesRangeSlider", i18n:false},
    hut_comment:{type:"markdown", parent:"locales"},
    hut_status:{values:attrs.hut_status},
    lang:{parent:"locales", values:attrs.langs},
    ice_rating:{values:attrs.ice_ratings, queryMode:"valuesRangeSlider", i18n:false},
    image_categories:{name:"categories", values:attrs.image_categories, multiple},
    image_type:{values:attrs.image_types, required},
    increase_impact:{type:"markdown", parent:"locales"},
    isbn:{minLength:9, maxLength:17},
    iso_speed:{type:"number", min:1, unit:"ISO"},
    labande_global_rating:{values:attrs.global_ratings, queryMode:"valuesRangeSlider", i18n:false},
    labande_ski_rating:{values:attrs.labande_ski_ratings, queryMode:"valuesRangeSlider", i18n:false},
    langs:{values:attrs.langs, multiple}, //TODO
    length:{type:"number", min:0, max:9999, unit:"m"},
    length_total:{type:"number", min:0, unit:"km", queryMode:"input"},
    lift_access:{values:[true, false, null], i18n:false},
    lift_status:{values:attrs.lift_status},
    main_waypoint_id:{}, //TODO
    maps_info:{type:"text"},
    matress_unstaffed:{values:[true, false, null]},
    mixed_rating:{values:attrs.mixed_ratings, queryMode:"valuesRangeSlider", i18n:false},
    modifications:{type:"markdown", parent:"locales"},
    motivations:{type:"markdown", parent:"locales"},
    mtb_down_rating:{values:attrs.mtb_down_ratings, queryMode:"valuesRangeSlider", i18n:false},
    mtb_height_diff_portages:{type:"number", min:0, max:5000, unit:"m"},
    mtb_length_asphalt:{type:"number", min:0, max:50, unit:"km"},
    mtb_length_trail:{type:"number", min:0, max:50, unit:"km"},
    mtb_up_rating:{values:attrs.mtb_up_ratings, queryMode:"valuesRangeSlider", i18n:false},
    name:{disabled}, // for profile
    nb_impacted:{type:"number", min:0, max:1000},
    nb_outings:{values:attrs.nb_outings},
    nb_pages:{type:"number", min:0, max:9999, unit:"#"},
    nb_participants:{type:"number", min:0, max:1000},
    orientations:{values:attrs.orientation_types, multiple:true, queryMode:"orientations", i18n:false},
    other_comments:{type:"markdown", parent:"locales"},
    paragliding_rating:{values:attrs.paragliding_ratings, queryMode:"valuesRangeSlider", i18n:false},
    parking_fee:{values:attrs.parking_fee_types},
    partial_trip:{type:"boolean"},
    participant_count:{type:"number", min:1, max:9999},
    participants:{type:"text"},
    phone:{type:"tel"},
    phone_custodian:{type:"tel"},
    place:{type:"markdown", parent:"locales"},
    previous_injuries:{values:attrs.previous_injuries},
    product_types:{values:attrs.product_types, multiple},
    prominence:{type:"number", min:0, max:9999, unit:"m"},
    public_transport:{type:"boolean"},
    public_transportation_rating:{values:attrs.public_transportation_ratings},
    public_transportation_types:{values:attrs.public_transportation_types, multiple},
    publication_date:{type:"text"},
    quality:{values:attrs.quality_types, queryMode:"valuesRangeSlider", i18n: true},
    rain_proof:{values:attrs.rain_proof_types},
    reduce_impact:{type:"markdown", parent:"locales"},
    remarks:{type:"markdown", parent:"locales"},
    rescue:{type:"boolean"},
    risk:{type:"markdown", parent:"locales"},
    risk_rating:{values:attrs.risk_ratings, queryMode:"valuesRangeSlider", i18n:false},
    rock_free_rating:{values:attrs.climbing_ratings, queryMode:"valuesRangeSlider", i18n:false},
    rock_required_rating:{values:attrs.climbing_ratings, queryMode:"valuesRangeSlider", i18n:false},
    rock_types:{values:attrs.rock_types, multiple},
    route_description:{type:"markdown", parent:"locales"},
    route_history:{type:"markdown", parent:"locales"},
    route_length:{type:"number", min:0, max:100000, unit:"m"},
    route_study:{type:"markdown", parent:"locales"},
    route_types:{values:attrs.route_types, multiple},
    routes_quantity:{type:"number", min:0, max:9999},
    safety:{type:"markdown", parent:"locales"},
    scale:{type:"text"},
    severity:{values:attrs.severities},
    ski_exposition:{values:attrs.exposition_ratings, queryMode:"valuesRangeSlider", i18n:false},
    ski_rating:{values:attrs.ski_ratings, queryMode:"valuesRangeSlider", i18n:false},
    slackline_anchor1:{type:"markdown", parent:"locales"},
    slackline_anchor2:{type:"markdown", parent:"locales"},
    slackline_height:{type:"number", min:0, unit:"m"},
    slackline_length_max:{type:"number", min:0, max:9999, unit:"m"},
    slackline_length_min:{type:"number", min:0, max:9999, unit:"m"},
    slackline_type:{values:attrs.slackline_types},
    slackline_types:{values:attrs.slackline_types, multiple}, // for waypoints
    slope:{type:'text', parent:"locales"}, //locale, but NOT markdown
    waypoint_slope:{name:"slope", type:'number', min:0, max:99, unit:"&deg;"}, //locale, but NOT markdown
    snow_clearance_rating:{values:attrs.snow_clearance_ratings},
    snow_quality:{values:attrs.condition_ratings},
    snow_quantity:{values:attrs.condition_ratings},
    snowshoe_rating:{values:attrs.snowshoe_ratings, queryMode:"valuesRangeSlider", i18n:false},
    summary:{type:"markdown", parent:"locales"},
    time_management:{type:"markdown", parent:"locales"},
    timing:{type:"markdown", parent:"locales"},
    title:{required, parent:"locales", minLength:3, queryMode:"input"},
    training:{type:"markdown", parent:"locales"},
    url:{type:"url", minLength:6},
    via_ferrata_rating:{values:attrs.via_ferrata_ratings, queryMode:"valuesRangeSlider", i18n:false},
    waypoint_type:{values:attrs.waypoint_types},
    weather:{type:"markdown", parent:"locales"},
    weather_station_types:{values:attrs.weather_station_types, multiple},
    width:{type:"number",disabled},
}


function Field(name, properties){

    this.name = name

    var baseProperties = fieldsProperties[name]

    for(let key of Object.keys(baseProperties)){
        this[key] = baseProperties[key]
    }

    if(properties){
        for(let key of Object.keys(properties)){
            this[key] = properties[key]
        }
    }

    this.type = this.type || "text"

    //Does the values can be translated
    if(this.i18n === undefined){
        if(this.type=="number")
            this.i18n = false
        else if(this.type=="text")
            this.i18n = true
        else if(this.values)
            this.i18n = true
        else
            this.i18n = false
    }

    if(!this.queryMode){
        if(this.type=="number"){
            this.queryMode = "numericalRangeSlider"
        } else if(this.type=="boolean"){
            this.queryMode = "checkbox"
        } else if(this.values){
            this.queryMode = "multiSelect"
        }
    }

    const identity = function(value){ return value }
    const joinWithComma = function(value){ return value.join(",") }

    const splitWithComma = function(value){
        value = value ? value : this.defaultUrlQuery
        return value.split(",")
    }

    const splitIntegersWithComma = function(value){
        value = value ? value : this.defaultUrlQuery
        value = value.split(",")
        return [parseInt(value[0]), parseInt(value[1])]
    }

    const parseUrlArray = function(value){
        if(!value)
            return this.defaultUrlQuery ==='' ? [] : this.defaultUrlQuery.split(",")

        return value.split(",")
    }

    const parseUrlBoolean = function(value){
        if(value === null || value === undefined || value === '' || value === 'false')
            return false

        return true
    }

    const parseUrlDefault = function(value){
        value = value ? value : this.defaultUrlQuery

        if(this.type === "number"){
            return parseInt(value)
        }

        else if(this.type === "text"){
            return value
        }

        else
            throw "Unknow field type : " + this
    }

    var defaultUrlQuery

    if(this.queryMode=="numericalRangeSlider"){
        this.valueToUrl = joinWithComma
        this.urlToValue = splitIntegersWithComma
        defaultUrlQuery = [this.min, this.max].join(",")
    }

    else if(this.queryMode=="valuesRangeSlider"){
        this.valueToUrl = joinWithComma
        this.urlToValue = splitWithComma
        defaultUrlQuery =  [this.values[0], this.values[this.values.length-1]].join(",")
    }

    else if(this.queryMode=="multiSelect" || this.queryMode=="orientations"){
        this.valueToUrl = joinWithComma
        this.urlToValue = parseUrlArray
        defaultUrlQuery =  ''
    }

    else if(this.queryMode=="checkbox"){
        this.valueToUrl = JSON.stringify
        this.urlToValue = parseUrlBoolean
        defaultUrlQuery =  'false'
    }

    else if(this.queryMode=="input"){
        this.valueToUrl = identity
        this.urlToValue = parseUrlDefault
        defaultUrlQuery =  {number:0, text:''}[this.type]
    }

    else if(this.queryMode=="activities"){
        this.valueToUrl = joinWithComma
        this.urlToValue = parseUrlArray
        defaultUrlQuery =  ''
    }

    else if(this.url !== undefined){
        throw "Unknow field queryMode for " + this.name + ": " + this.queryMode
    }

    this.defaultUrlQuery = this.defaultUrlQuery === undefined ? defaultUrlQuery : this.defaultUrlQuery
}

Field.prototype.isVisibleFor = function(params){

    const intersectionIsNotNull = function(arrayA, arrayB){
        for(let itemA of arrayA){
            if(arrayB.includes(itemA))
                return true
        }

        return false
    }

    if(this.activities && params.activities)
        return intersectionIsNotNull(this.activities, params.activities)

    if(this.waypoint_types){
        if(params.waypoint_type)
            return this.waypoint_types.includes(params.waypoint_type)

        if(params.waypoint_types)
            return intersectionIsNotNull(this.waypoint_types, params.waypoint_types)

        return false;
    }

    return true;
}

function Constants(){
    this.activities = attrs.activities

    this.langs = attrs.langs

    // You can fin in
    //     https://github.com/c2corg/v6_common/blob/master/c2corg_common/associations.py

    // also, GUI avalaible associtions can be found here, on dataset attribute :
    //     https://github.com/c2corg/v6_ui/search?l=HTML&q=app-add-association

    this.objectDefinitions = {
        area:{
            letter:"a",
            fields:getFieldsObject(
                new Field("title", {url:"q"}),
                new Field("summary"),
                new Field("description"),
                new Field("lang", {url:"l"}),

                new Field("area_type", {url:"atyp"}),
                new Field("quality", {url:"qa"}),
            ),
            validAssociations:[],
        },

        article:{
            letter:"c",
            fields:getFieldsObject(
                new Field("title", {url:"q"}),
                new Field("summary"),
                new Field("description"),
                new Field("lang", {url:"l"}),

                new Field("activities", {url:"act"}),
                new Field("article_categories", {url:"acat"}),
                new Field("quality", {url:"qa"}),
                new Field("article_type", {url:"atyp"}),
            ),
            validAssociations:["article", "waypoint", "outing", "route", "book"],
        },

        book:{
            letter:"b",
            fields:getFieldsObject(
                new Field("title", {url:"q"}),
                new Field("summary"),
                new Field("description"),
                new Field("lang", {url:"l"}),

                new Field("author"),
                new Field("editor"),
                new Field("activities", {url:"act"}),
                new Field("url"),
                new Field("isbn"),
                new Field("book_types", {url:"btyp"}),
                new Field("publication_date"),
                new Field("quality", {url:"qa"}),
                new Field("langs"),
                new Field("nb_pages"),
            ),
            validAssociations:["route", "article", "waypoint"],
        },

        image:{
            letter:"i",
            geoLocalized:true,
            fields:getFieldsObject(
                new Field("title", {required:false}),
                new Field("summary"),
                new Field("description"),
                new Field("lang", {url:"l"}),

                new Field("activities", {url:"act"}),
                new Field("author"),
                new Field("camera_name"),
                new Field("date_time"),
                new Field("elevation", {url:"ialt"}),
                new Field("height"),
                new Field("image_categories", {url:"cat"}),
                new Field("image_type", {url:"ityp"}),
                new Field("iso_speed"),
                new Field("file_size"),
                new Field("filename"),
                new Field("exposure_time"),
                new Field("focal_length"),
                new Field("fnumber"),
                new Field("quality", {url:"qa"}),
                new Field("width"),
            ),
            validAssociations:["waypoint", "route", "book", "article"],
        },

        map:{
            letter:"m",
            fields:getFieldsObject(
                new Field("title", {url:"q"}),
                new Field("description"),
                new Field("lang", {url:"l"}),

                new Field("code"),
                new Field("scale"),
                new Field("editor"),
            ),
            validAssociations:[],
        },

        outing:{
            letter:"o",
            geoLocalized:true,
            fields:getFieldsObject(
                new Field("title", {url:"q"}),
                new Field("summary"),
                new Field("description"),
                new Field("participants"),
                new Field("access_comment"),
                new Field("weather"),
                new Field("timing"),
// TODO                new Field("conditions_levels"),
                new Field("conditions"),
                new Field("hut_comment"),
                new Field("route_description"),
                new Field("avalanches", {activities:["snow_ice_mixed", "ice_climbing", "snowshoeing", "skitouring"]}),
                new Field("lang", {url:"l"}),

                new Field("access_condition"),
                new Field("activities", {url:"act"}),
                new Field("avalanche_signs", {url:"avdate", activities:["ice_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]}),
                new Field("condition_rating", {url:"ocond"}),
                new Field("date_end"),
                new Field("date_start"),
                new Field("disable_comments"),
                new Field("elevation_access", {url:"oparka"}),
                new Field("elevation_down_snow", {url:"swld", activities:["ice_climbing", "mountain_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]}),
                new Field("elevation_max", {url:"oalt"}),
                new Field("elevation_min"),
                new Field("elevation_up_snow", {url:"swlu", activities:["ice_climbing", "mountain_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]}),
                new Field("engagement_rating", {url:"erat", activities:["mountain_climbing", "snow_ice_mixed"]}),
                new Field("equipment_rating", {url:"prat", activities:["rock_climbing"]}),
                new Field("frequentation", {url:"ofreq"}),
                new Field("glacier_rating", {url:"oglac", activities:["mountain_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]}),
                new Field("global_rating", {url:"grat", activities:["mountain_climbing", "rock_climbing", "snow_ice_mixed"]}),
                new Field("height_diff_difficulties", {url:"dhei", activities:["mountain_climbing", "snow_ice_mixed"]}),
                new Field("height_diff_down"),
                new Field("height_diff_up", {url:"odif"}),
                new Field("hiking_rating", {url:"hrat", activities:["hiking"]}),
                new Field("hut_status"),
                new Field("ice_rating", {url:"irat", activities:["ice_climbing"]}),
                new Field("labande_global_rating", {url:"lrat", activities:["skitouring"]}),
                new Field("length_total", {url:"olen"}),
                new Field("lift_status"),
                new Field("mtb_down_rating", {url:"mbdr", activities:["mountain_biking"]}),
                new Field("mtb_up_rating", {url:"mbur", activities:["mountain_biking"]}),
                new Field("partial_trip"),
                new Field("participant_count"),
                new Field("public_transport", {url:"owpt"}),
                new Field("quality", {url:"qa"}),
                new Field("rock_free_rating", {url:"frat", activities:["rock_climbing"]}),
                new Field("ski_rating", {url:"trat", activities:["skitouring"]}),
                new Field("snow_quality", {url:"swqual", activities:["ice_climbing", "mountain_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]}),
                new Field("snow_quantity", {url:"swquan", activities:["ice_climbing", "mountain_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]}),
                new Field("snowshoe_rating", {url:"wrat", activities:["snowshoeing"]}),
                new Field("via_ferrata_rating", {url:"krat", activities:["via_ferrata"]}),
            ),
            validAssociations:["article", "route", "xreport"],
        },

        profile:{
            letter:"u",
            geoLocalized:true,
            fields:getFieldsObject(
                new Field("title", {url:"q"}),
                new Field("summary"),
                new Field("description"),
                new Field("lang", {url:"l"}),

                new Field("activities", {url:"act"}),
                new Field("categories"),
                new Field("name"),
            ),
            validAssociations:[],
        },

        route:{
            letter:"r",
            geoLocalized:true,
            fields:getFieldsObject(
                new Field("title", {url:"q"}),
                new Field("summary"),
                new Field("route_history"),
                new Field("description"),
                new Field("slackline_anchor1", {activities:["slacklining"]}),
                new Field("slackline_anchor2", {activities:["slacklining"]}),
                new Field("slope", {activities:["snow_ice_mixed", "ice_climbing", "snowshoeing", "skitouring"]}),
                new Field("remarks"),
                new Field("gear"),
                new Field("external_resources"),
                new Field("lang", {url:"l"}),

                new Field("activities", {url:"act"}),
                new Field("aid_rating", {url:"arat", activities:["rock_climbing", "mountain_climbing"]}),
                new Field("climbing_outdoor_type", {url:"crtyp", activities:["rock_climbing"]}),
                new Field("configuration", {url:"conf", activities:["rock_climbing", "via_ferrata", "snow_ice_mixed", "mountain_climbing", "snowshoeing", "skitouring"]}),
                new Field("difficulties_height", {url:"ralt", activities:["rock_climbing", "via_ferrata", "snow_ice_mixed", "mountain_climbing", "ice_climbing"]}),
                new Field("durations", {url:"time", activities:no_paragliding_or_slacklining}),
                new Field("elevation_max", {url:"rmaxa", activities:no_paragliding_or_slacklining}),
                new Field("elevation_min", {url:"rmina", activities:no_paragliding_or_slacklining}),
                new Field("engagement_rating", {url:"erat", activities:["rock_climbing", "via_ferrata", "snow_ice_mixed", "mountain_climbing", "ice_climbing"]}),
                new Field("equipment_rating", {url:"prat", activities:["rock_climbing", "via_ferrata", "snow_ice_mixed", "mountain_climbing", "ice_climbing"]}),
                new Field("exposition_rock_rating", {url:"rexpo", activities:["rock_climbing", "mountain_climbing"]}),
                new Field("glacier_gear", {url:"glac", activities:["hiking", "rock_climbing", "snow_ice_mixed", "mountain_climbing", "ice_climbing", "snowshoeing", "skitouring"]}),
                new Field("global_rating", {url:"grat", activities:["rock_climbing", "snow_ice_mixed", "mountain_climbing", "ice_climbing"]}),
                new Field("height_diff_access", {url:"rappr", activities:no_paragliding_or_slacklining}),
                new Field("height_diff_difficulties", {url:"dhei", activities:no_paragliding_or_slacklining}),
                new Field("height_diff_down", {url:"ddif", activities:no_paragliding_or_slacklining}),
                new Field("height_diff_up", {url:"hdif", activities:no_paragliding_or_slacklining}),
                new Field("hiking_mtb_exposition", {url:"hexpo", activities:["hiking", "mountain_biking"]}),
                new Field("hiking_rating", {url:"hrat", activities:["hiking"]}),
                new Field("ice_rating", {url:"irat", activities:["snow_ice_mixed", "ice_climbing"]}),
                new Field("labande_global_rating", {url:"lrat", activities:["skitouring"]}),
                new Field("labande_ski_rating", {url:"srat", activities:["skitouring"]}),
                new Field("lift_access"),
                new Field("main_waypoint_id"),
                new Field("mixed_rating", {url:"mrat", activities:["snow_ice_mixed", "ice_climbing"]}),
                new Field("mtb_down_rating", {url:"mbdr", activities:["mountain_biking"]}),
                new Field("mtb_height_diff_portages", {url:"mbpush", activities:["mountain_biking"]}),
                new Field("mtb_length_asphalt", {url:"mbroad", activities:["mountain_biking"]}),
                new Field("mtb_length_trail", {url:"mbtrack", activities:["mountain_biking"]}),
                new Field("mtb_up_rating", {url:"mbur", activities:["mountain_biking"]}),
                new Field("orientations", {url:"fac"}),
                new Field("quality", {url:"qa"}),
                new Field("risk_rating", {url:"orrat", activities:["rock_climbing", "snow_ice_mixed", "mountain_climbing", "ice_climbing"]}),
                new Field("rock_free_rating", {url:"frat", activities:["rock_climbing", "mountain_climbing"]}),
                new Field("rock_required_rating", {url:"rrat", activities:["rock_climbing", "mountain_climbing"]}),
                new Field("rock_types", {url:"rock", activities:["rock_climbing", "via_ferrata", "snow_ice_mixed", "mountain_climbing"]}),
                new Field("route_length", {url:"rlen", activities:["hiking", "slacklining", "via_ferrata", "snow_ice_mixed", "mountain_biking", "snowshoeing", "skitouring"]}),
                new Field("route_types", {url:"rtyp", activities:no_paragliding_or_slacklining}),
                new Field("ski_exposition", {url:"sexpo", activities:["skitouring"]}),
                new Field("ski_rating", {url:"trat", activities:["skitouring"]}),
                new Field("slackline_height", {activities:["slacklining"]}),
                new Field("slackline_type", {url:"sltyp", activities:["slacklining"]}),
                new Field("snowshoe_rating", {url:"wrat", activities:["snowshoeing"]}),
                new Field("via_ferrata_rating", {url:"krat", activities:["via_ferrata"]}),
            ),
            validAssociations:["route", "waypoint", "article", "book", "xreport"],
        },

        waypoint:{
            letter:"w",
            geoLocalized:true,
            fields:getFieldsObject(
                new Field("title", {url:"q"}),
                new Field("summary"),
                new Field("description"),
                new Field("access", {waypoint_types:["access", "climbing_indoor", "climbing_outdoor", "hut", "local_product", "slackline_spot"]}),
                new Field("access_period", {waypoint_types:["access", "camp_site", "climbing_outdoor", "gite", "hut", "local_product"]}),
                new Field("lang", {url:"l"}),

                new Field("access_time", {url:'tappt', waypoint_types:["climbing_outdoor", "slackline_spot"]}),
                new Field("best_periods", {url:'period', waypoint_types:["climbing_outdoor", "slackline_spot"]}),
                new Field("blanket_unstaffed", {waypoint_types:["hut", "shelter"]}),
                new Field("capacity", {url:'hucap', waypoint_types:["bivouac", "camp_site", "gite", "hut", "shelter"]}),
                new Field("capacity_staffed", {url:'hscap', waypoint_types:["camp_site", "gite", "hut"]}),
                new Field("children_proof", {url:'chil', waypoint_types:["climbing_outdoor"]}),
                new Field("climbing_indoor_types", {url:'ctin', waypoint_types:["climbing_indoor"]}),
                new Field("climbing_outdoor_types", {url:'ctout', waypoint_types:["climbing_outdoor"]}),
                new Field("climbing_rating_max", {url:'tmaxr', waypoint_types:only_climbing}),
                new Field("climbing_rating_median", {url:'tmedr', waypoint_types:only_climbing}),
                new Field("climbing_rating_min", {url:'tminr', waypoint_types:only_climbing}),
                new Field("climbing_styles", {url:'tcsty', waypoint_types:only_climbing}),
                new Field("custodianship", {url:'hsta', waypoint_types:["camp_site", "gite", "hut"]}),
                new Field("elevation", {url:"walt"}),
                new Field("elevation_min", {waypoint_types:["access"]}),
                new Field("equipment_ratings", {url:'anchq', waypoint_types:["climbing_outdoor"]}),
                new Field("exposition_rating", {url:'pglexp', waypoint_types:only_paragliding}),
                new Field("gas_unstaffed", {waypoint_types:["hut", "shelter"]}),
                new Field("ground_types", {waypoint_types:only_paragliding}),
                new Field("heating_unstaffed", {waypoint_types:["hut", "shelter"]}),
                new Field("height_max", {url:'tmaxh', waypoint_types:only_climbing}),
                new Field("height_median", {url:'tmedh', waypoint_types:only_climbing}),
                new Field("height_min", {url:'tminh', waypoint_types:only_climbing}),
                new Field("length", {url:'len', waypoint_types:only_paragliding}),
                new Field("lift_access", {url:'plift', waypoint_types:["access"]}),
                new Field("maps_info"),

                new Field("matress_unstaffed", {waypoint_types:["hut", "shelter"]}),
                new Field("orientations", {url:"wfac", waypoint_types:["climbing_outdoor", "paragliding_landing", "paragliding_takeoff", "slackline_spot"]}),
                new Field("paragliding_rating", {url:'pgrat', waypoint_types:only_paragliding}),
                new Field("parking_fee", {waypoint_types:["access"]}),
                new Field("phone", {waypoint_types:["camp_site", "climbing_indoor", "gite", "hut", "local_product"]}),
                new Field("phone_custodian", {waypoint_types:["camp_site", "gite", "hut"]}),
                new Field("product_types", {url:'ftyp', waypoint_types:["local_product"]}),
                new Field("prominence", {url:'prom', waypoint_types:["summit"]}),
                new Field("public_transportation_rating", {url:'tp', waypoint_types:["access"]}),
                new Field("public_transportation_types", {url:'tpty', waypoint_types:["access"]}),
                new Field("quality", {url:"qa"}),
                new Field("rain_proof", {url:'rain', waypoint_types:["climbing_outdoor"]}),
                new Field("rock_types", {url:"wrock", waypoint_types:["climbing_outdoor"]}),
                new Field("routes_quantity", {url:'rqua', waypoint_types:only_climbing}),
                new Field("slackline_length_max", {waypoint_types:only_slackline}),
                new Field("slackline_length_min", {waypoint_types:only_slackline}),
                new Field("slackline_types", {waypoint_types:only_slackline}),
                new Field("waypoint_slope", {waypoint_types:only_paragliding}),
                new Field("snow_clearance_rating", {url:'psnow', waypoint_types:["access"]}),
                new Field("url", {waypoint_types:["camp_site", "climbing_indoor", "climbing_outdoor", "gite", "hut", "local_product", "weather_station", "webcam"]}),
                new Field("waypoint_type", {url:'wtyp'}),
                new Field("weather_station_types", {url:'whtyp'}),
            ),
            validAssociations:["waypoint", "article", "book", "xreport"],
        },

        xreport:{
            letter:"x",
            geoLocalized:true,
            fields:getFieldsObject(
                new Field("title", {url:"q"}),
                new Field("summary"),
                new Field("description"),
                new Field("place"),
                new Field("route_study"),
                new Field("conditions"),
                new Field("training"),
                new Field("motivations"),
                new Field("group_management"),
                new Field("risk"),
                new Field("time_management"),
                new Field("safety"),
                new Field("reduce_impact"),
                new Field("increase_impact"),
                new Field("modifications"),
                new Field("other_comments"),
                new Field("lang", {url:"l"}),

                new Field("elevation", {url:"xalt"}),
                new Field("date"),
                new Field("event_type", {url:"xtyp"}),
                new Field("activities", {url:"act"}),
                new Field("nb_participants", {url:"xpar"}),
                new Field("nb_impacted", {url:"ximp"}),
                new Field("rescue"),
                new Field("avalanche_level"),
                new Field("avalanche_slope"),
                new Field("severity", {url:"xsev"}),
                new Field("author_status"),
                new Field("activity_rate"),
                new Field("nb_outings"),
                new Field("age"),
                new Field("gender"),
                new Field("previous_injuries"),
                new Field("autonomy"),
                new Field("disable_comments"),
                new Field("anonymous"),
                new Field("quality", {url:"qa"}),
            ),
            validAssociations:["route", "outing", "article"],
        },
    };

    this.documentTypes = Object.keys(this.objectDefinitions)

    this.letterToType = {}
    for(let type of this.documentTypes){
        let definition = this.objectDefinitions[type]

        this.letterToType[definition.letter] = type
        definition.type = type

        // Let's build objectDefinitions.<type>.validAssociations
        // it's an array of string, transform it to an object of
        // <string, definition>
        let validAssociations = {}

        for(let type of definition.validAssociations){
            validAssociations[type] = this.objectDefinitions[type]
        }

        definition.validAssociations = validAssociations
    }
}

Constants.prototype.getDocumentType = function(type){
    return type.length == 1 ? this.letterToType[type] : type
}

Constants.prototype.buildLocale = function(type, lang){
    var def = this.objectDefinitions[type]

    var result = {}

    for(let field of Object.values(def.fields)){
        if(field.parent == "locales"){
            result[field.name]=field.multiple ? new Array() : null
        }
    }

    result.lang = lang

    return result
}

Constants.prototype.buildDocument = function(type, lang){
    var def = this.objectDefinitions[type];

    var result = {
        type:def.letter,
        locales:[
            this.buildLocale(type, lang)
        ],
    }

    for(let field of Object.values(def.fields)){
        if(field.parent != "locales"){
            result[field.name]= field.multiple ? new Array() : null
        }
    }

    return result
}


export default new Constants()



/*
function export_from_common(type, propertyName){
    var lf = {}
    var f = {}

    for(let subCategory of Object.keys(common.fields[type])){
        let def = common.fields[type][subCategory]


        for(let fieldName of def.fields){
            let subCategories

            if(fieldName.startsWith("locales.")){
                fieldName = fieldName.replace("locales.", "")

                subCategories = (lf[fieldName] || [])
                lf[fieldName] = subCategories

            } else {

                subCategories = (f[fieldName] || [])
                f[fieldName] = subCategories
            }

            if(subCategories.indexOf(subCategory) == -1)
                subCategories.push(subCategory)

        }
    }

    function get_js(className, fields){
        var result = ""

        for(let field of Object.keys(fields).sort()){
            let subCategories = fields[field].sort()

            if(subCategories.length == attrs.waypoint_types.length && propertyName=="waypoint_types")
                subCategories = ''
            else if(subCategories.length == 11 && type=="outing")
                subCategories = ''
            else if (subCategories.length == 10 && type=="route")
                subCategories = ''
            else if (subCategories.length == 9 && subCategories.indexOf("paragliding") == -1 && subCategories.indexOf("slacklining") == -1 && propertyName != "waypoint_types")
                subCategories = ', {' + propertyName + ':no_paragliding_or_slacklining}'
            else
                subCategories = ', {' + propertyName + ':["' + fields[field].join('", "') + '"]}'

            result += 'new ' + className + '("' + field + '"' + subCategories + '),\n'

        }

        return result
    }

    console.log(get_js('LocaleField', lf))
    console.log(get_js('Field', f))
}

export_from_common("outing", "activities");
export_from_common("route", "activities");
export_from_common("waypoint", "waypoint_types");
*/
