
import common from '@/js/common.js'


function Field(name, properties){

    var attrs = common.attributes;

    //shorthand for true only properties (missing prop means false)

    var required=true;
    var disabled=true;
    var multiple=true;

    //todo : geom, longlat, condiction_levels

    var fields = {

        /*
        //locales' fields
        title: {isRawText:true},
        external_resources : {label:"External resources"},
        route_history : {label:"History"},
        slope : {isRawText:true},

        // document's fields
        climbing_outdoor_typ:{values:attrs.climbing_outdoor_types},
        configuration:{values:attrs.route_configuration_types, multiple:true},
        orientations:{values:attrs.orientation_types, multiple:true},
        glacier_gear:{values:attrs.glacier_gear_types},
        quality:{values:attrs.quality_types},
        rock_types:{values:attrs.rock_types, multiple:true},
        route_types:{values:attrs.route_types, multiple:true},
        slackline_type:{values:attrs.slackline_types},
        durations:{values:attrs.route_duration_types, multiple:true},

        difficulties_height:{type:"number", min:0, unit:"m"},
        prominence:{type:"number", max:9000, unit:"m"},
        height_diff_access:{type:"number", min:0, unit:"m"},
        height_diff_down:{type:"number", min:0, unit:"m"},
        height_diff_up:{type:"number", min:0, unit:"m"},
        mtb_length_asphalt:{type:"number", min:0, unit:"km"},
        mtb_length_trail:{type:"number", min:0, unit:"km"},
        mtb_height_diff_portages:{type:"number", min:0, unit:"km"},
        route_length:{type:"number", min:0, unit:"km"},
        slackline_height:{type:"number", min:0, unit:"km"},

        climbing_outdoor_types:{values:common.attributes.climbing_outdoor_types, multiple:true},
        climbing_indoor_types:{values:common.attributes.climbing_indoor_types, multiple:true},
        waypoint_type:{values:common.attributes.waypoint_types},
        slackline_types:{values:common.attributes.slackline_types, multiple:true},
        climbing_styles:{values:common.attributes.climbing_styles, multiple:true},
        best_periods:{values:common.attributes.months, multiple:true},
        access_time:{values:common.attributes.access_times},
        rain_proof:{values:common.attributes.rain_proof_types},
        children_proof:{values:common.attributes.children_proof_types},
        */


        access:{},
        access_comment:{},
        access_condition:{values:attrs.access_conditions},
        access_period:{},
        access_time:{},
        activities:{values:attrs.activities, multiple},
        activity_rate:{},
        age:{},
        aid_rating:{values:common.attributes.aid_ratings},
        anonymous:{},
        area_type:{values:attrs.area_types},
        article_type:{values:attrs.article_types},
        author:{minLength:2},
        author_status:{},
        autonomy:{},
        avalanche_level:{},
        avalanche_signs:{},
        avalanche_slope:{},
        avalanches:{},
        best_periods:{},
        blanket_unstaffed:{},
        book_types:{},
        camera_name:{},
        capacity:{},
        capacity_staffed:{},
        categories:{values:attrs.user_categories, multiple},
        children_proof:{},
        climbing_indoor_types:{},
        climbing_outdoor_typ:{},
        climbing_outdoor_type:{values:attrs.climbing_outdoor_types},
        climbing_outdoor_types:{},
        climbing_rating_max:{},
        climbing_rating_median:{},
        climbing_rating_min:{},
        climbing_styles:{},
        code:{},
        condition_rating:{},
        conditions:{values:attrs.condition_ratings},
        configuration:{},
        custodianship:{},
        date:{},
        date_end:{type:"date"},
        date_start:{type:"date", required},
        date_time:{type:"date_time"}, // wasn't in common... //todo : max:today
        description:{},
        difficulties_height:{type:"number", min:0, max:9999, unit:"m"},
        disable_comments:{type:"boolean"},
        durations:{},
        editor:{minLength:2},
        elevation:{type:"number", min:0, max:9000, unit:"m"},
        elevation_access:{type:"number", min:0, max:9999, unit:"m"},
        elevation_down_snow:{type:"number", min:0, max:9999, unit:"m"},
        elevation_max:{type:"number", min:0, max:9999, unit:"m"},
        elevation_min:{type:"number", min:0, max:9999, unit:"m"},
        elevation_up_snow:{type:"number", min:0, max:9999, unit:"m"},
        engagement_rating:{values:attrs.engagement_ratings},
        equipment_rating:{values:attrs.equipment_ratings},
        equipment_ratings:{values:attrs.equipment_ratings},
        event_type:{},
        exposition_rating:{},
        exposition_rock_rating:{values:common.attributes.exposition_rock_ratings},
        exposure_time:{type:"number",min:0, max:0},
        external_resources:{},
        file_size:{},
        filename:{disabled},
        fnumber:{},
        focal_length:{type:"number",min:1},
        frequentation:{values:attrs.frequentation_types},
        gas_unstaffed:{},
        gear:{},
        gender:{},
        glacier_gear:{},
        glacier_rating:{values:common.attributes.glacier_ratings},
        global_rating:{values:common.attributes.global_ratings},
        ground_types:{},
        group_management:{},
        heating_unstaffed:{},
        height:{},
        height_diff_access:{type:"number", min:0, unit:"m"},
        height_diff_difficulties:{type:"number", min:0, unit:"m"},
        height_diff_down:{type:"number", min:0, unit:"m"},
        height_diff_up:{type:"number", min:0, unit:"m"},
        height_max:{},
        height_median:{},
        height_min:{},
        hiking_mtb_exposition:{values:common.attributes.exposition_ratings},
        hiking_rating:{values:attrs.hiking_ratings},
        hut_comment:{},
        hut_status:{values:attrs.hut_status},
        ice_rating:{values:common.attributes.ice_ratings},
        image_type:{values:attrs.image_types},
        isbn:{minLength:9, maxLength:17},
        iso_speed:{type:"number", min:1},
        labande_global_rating:{values:attrs.global_ratings},
        labande_ski_rating:{values:attrs.labande_ski_ratings},
        langs:{},
        length:{},
        length_total:{type:"number", min:0, unit:"km"},
        lift_access:{values:[true, false, null]},
        lift_status:{values:attrs.lift_status},
        main_waypoint_id:{},
        maps_info:{},
        matress_unstaffed:{},
        mixed_rating:{values:attrs.mixed_ratings},
        modifications:{},
        motivations:{},
        mtb_down_rating:{values:common.attributes.mtb_down_ratings},
        mtb_height_diff_portages:{type:"number", min:0, unit:"m"},
        mtb_length_asphalt:{type:"number", min:0, unit:"km"},
        mtb_length_trail:{type:"number", min:0, unit:"km"},
        mtb_up_rating:{values:common.attributes.mtb_up_ratings},
        name:{disabled}, // for profile
        nb_impacted:{},
        nb_outings:{},
        nb_pages:{type:"number", min:0, max:9999},
        nb_participants:{},
        orientations:{},
        other_comments:{},
        paragliding_rating:{},
        parking_fee:{},
        partial_trip:{type:"boolean"},
        participant_count:{type:"number", min:1, max:9999},
        participants:{},
        phone:{},
        phone_custodian:{},
        place:{},
        previous_injuries:{},
        product_types:{},
        prominence:{},
        public_transport:{type:"boolean"},
        public_transportation_rating:{},
        public_transportation_types:{},
        publication_date:{},
        quality:{},
        rain_proof:{},
        reduce_impact:{},
        remarks:{},
        rescue:{},
        risk:{},
        risk_rating:{values:common.attributes.risk_ratings},
        rock_free_rating:{values:common.attributes.climbing_ratings},
        rock_required_rating:{values:common.attributes.climbing_ratings},
        rock_types:{},
        route_description:{},
        route_history:{},
        route_length:{type:"number", min:0, unit:"km"},
        route_study:{},
        route_types:{},
        routes_quantity:{},
        safety:{},
        scale:{},
        severity:{},
        ski_exposition:{values:attrs.exposition_ratings},
        ski_rating:{values:attrs.ski_ratings},
        slackline_anchor1:{},
        slackline_anchor2:{},
        slackline_height:{type:"number", min:0, unit:"m"},
        slackline_length_max:{},
        slackline_length_min:{},
        slackline_type:{values:attrs.slackline_types},
        slackline_types:{},
        slope:{type:'text'}, //locale, but NOT markdown
        snow_clearance_rating:{},
        snow_quality:{values:attrs.condition_ratings},
        snow_quantity:{values:attrs.condition_ratings},
        snowshoe_rating:{values:attrs.snowshoe_ratings},
        summary:{},
        time_management:{},
        timing:{},
        title:{required, minLength:3},
        training:{},
        url:{type:"url", minLength:6},
        via_ferrata_rating:{values:attrs.via_ferrata_ratings},
        waypoint_type:{},
        weather:{},
        width:{},
    }

    this.name = name

    var baseProperties = fields[name]

    if(!baseProperties) console.log(name)
    for(let key of Object.keys(baseProperties)){
        this[key] = baseProperties[key]
    }


    if(properties){
        for(let key of Object.keys(properties)){
            this[key] = properties[key]
        }
    }

    this.label = this.label || this.name
    this.type = this.type || "text"
}

function getFieldsObject(){
    var result = {}

    for(let item of arguments){
        result[item.name] = item
    }

    return result
}

function Constants(){
    this.activities = common.attributes.activities

    this.langs = common.attributes.langs

    this.documentsGeoLocalization = [
        "routes",
        "waypoints",
        "profiles",
        "outings",
        "images",
        "xreports"
    ]


    //small helper for shorter code
    var no_paragliding_or_slacklining = [
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

    this.objectDefinitions = {
        route:{
            letter:"r",
            localeFields:getFieldsObject(
                new Field("title"),
                new Field("summary"),
                new Field("route_history"),
                new Field("description"),
                new Field("slackline_anchor1", {activities:["slacklining"]}),
                new Field("slackline_anchor2", {activities:["slacklining"]}),
                new Field("slope", {activities:["snow_ice_mixed", "ice_climbing", "snowshoeing", "skitouring"]}),
                new Field("remarks"),
                new Field("gear"),
                new Field("external_resources"),
            ),
            fields:getFieldsObject(
                new Field("activities"),
                new Field("aid_rating", {activities:["rock_climbing", "mountain_climbing"]}),
                new Field("climbing_outdoor_type", {activities:["rock_climbing"]}),
                new Field("configuration", {activities:["rock_climbing", "via_ferrata", "snow_ice_mixed", "mountain_climbing", "snowshoeing", "skitouring"]}),
                new Field("difficulties_height", {activities:["rock_climbing", "via_ferrata", "snow_ice_mixed", "mountain_climbing", "ice_climbing"]}),
                new Field("durations", {activities:no_paragliding_or_slacklining}),
                new Field("elevation_max", {activities:no_paragliding_or_slacklining}),
                new Field("elevation_min", {activities:no_paragliding_or_slacklining}),
                new Field("engagement_rating", {activities:["rock_climbing", "via_ferrata", "snow_ice_mixed", "mountain_climbing", "ice_climbing"]}),
                new Field("equipment_rating", {activities:["rock_climbing", "via_ferrata", "snow_ice_mixed", "mountain_climbing", "ice_climbing"]}),
                new Field("exposition_rock_rating", {activities:["rock_climbing", "mountain_climbing"]}),
                new Field("glacier_gear", {activities:["hiking", "rock_climbing", "snow_ice_mixed", "mountain_climbing", "ice_climbing", "snowshoeing", "skitouring"]}),
                new Field("global_rating", {activities:["rock_climbing", "snow_ice_mixed", "mountain_climbing", "ice_climbing"]}),
                new Field("height_diff_access", {activities:no_paragliding_or_slacklining}),
                new Field("height_diff_difficulties", {activities:no_paragliding_or_slacklining}),
                new Field("height_diff_down", {activities:no_paragliding_or_slacklining}),
                new Field("height_diff_up", {activities:no_paragliding_or_slacklining}),
                new Field("hiking_mtb_exposition", {activities:["hiking", "mountain_biking"]}),
                new Field("hiking_rating", {activities:["hiking"]}),
                new Field("ice_rating", {activities:["snow_ice_mixed", "ice_climbing"]}),
                new Field("labande_global_rating", {activities:["skitouring"]}),
                new Field("labande_ski_rating", {activities:["skitouring"]}),
                new Field("lift_access"),
                new Field("main_waypoint_id"),
                new Field("mixed_rating", {activities:["snow_ice_mixed", "ice_climbing"]}),
                new Field("mtb_down_rating", {activities:["mountain_biking"]}),
                new Field("mtb_height_diff_portages", {activities:["mountain_biking"]}),
                new Field("mtb_length_asphalt", {activities:["mountain_biking"]}),
                new Field("mtb_length_trail", {activities:["mountain_biking"]}),
                new Field("mtb_up_rating", {activities:["mountain_biking"]}),
                new Field("orientations"),
                new Field("quality"),
                new Field("risk_rating", {activities:["rock_climbing", "snow_ice_mixed", "mountain_climbing", "ice_climbing"]}),
                new Field("rock_free_rating", {activities:["rock_climbing", "mountain_climbing"]}),
                new Field("rock_required_rating", {activities:["rock_climbing", "mountain_climbing"]}),
                new Field("rock_types", {activities:["rock_climbing", "via_ferrata", "snow_ice_mixed", "mountain_climbing"]}),
                new Field("route_length", {activities:["hiking", "slacklining", "via_ferrata", "snow_ice_mixed", "mountain_biking", "snowshoeing", "skitouring"]}),
                new Field("route_types", {activities:no_paragliding_or_slacklining}),
                new Field("ski_exposition", {activities:["skitouring"]}),
                new Field("ski_rating", {activities:["skitouring"]}),
                new Field("slackline_height", {activities:["slacklining"]}),
                new Field("slackline_type", {activities:["slacklining"]}),
                new Field("snowshoe_rating", {activities:["snowshoeing"]}),
                new Field("via_ferrata_rating", {activities:["via_ferrata"]}),
            )
        },

        area:{
            letter:"a",
            localeFields:getFieldsObject(
                new Field("title"),
            ),
            fields:getFieldsObject(
                new Field("area_type"),
                new Field("quality"),
            )
        },

        article:{
            letter:"c",
            localeFields:getFieldsObject(
                new Field("title"),
                new Field("summary"),
                new Field("description"),
            ),
            fields:getFieldsObject(
                new Field("activities"),
                new Field("categories"),
                new Field("quality"),
                new Field("article_type"),
            )
        },

        book:{
            letter:"b",
            localeFields:getFieldsObject(
                new Field("title"),
                new Field("summary"),
                new Field("description"),
            ),
            fields:[
                new Field("author"),
                new Field("editor"),
                new Field("activities"),
                new Field("url"),
                new Field("isbn"),
                new Field("book_types"),
                new Field("publication_date"),
                new Field("langs"),
                new Field("nb_pages"),
            ]
        },

        map:{
            letter:"m",
            localeFields:getFieldsObject(
                new Field("title"),
            ),
            fields:[
                new Field("code"),
                new Field("scale"),
                new Field("editor"),
            ]
        },

        outing:{
            letter:"o",
            localeFields:getFieldsObject(
                new Field("title"),
                new Field("summary"),
                new Field("description"),
                new Field("participants"),
                new Field("access_comment"),
                new Field("weather"),
                new Field("timing"),
//                new Field("conditions_levels"),
                new Field("conditions"),
                new Field("hut_comment"),
                new Field("route_description"),
                new Field("avalanches", {activities:["snow_ice_mixed", "ice_climbing", "snowshoeing", "skitouring"]}),
            ),
            fields:getFieldsObject(
                new Field("access_condition"),
                new Field("activities"),
                new Field("avalanche_signs", {activities:["ice_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]}),
                new Field("condition_rating"),
                new Field("date_end"),
                new Field("date_start"),
                new Field("disable_comments"),
                new Field("elevation_access"),
                new Field("elevation_down_snow", {activities:["ice_climbing", "mountain_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]}),
                new Field("elevation_max"),
                new Field("elevation_min"),
                new Field("elevation_up_snow", {activities:["ice_climbing", "mountain_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]}),
                new Field("engagement_rating", {activities:["mountain_climbing", "snow_ice_mixed"]}),
                new Field("equipment_rating", {activities:["rock_climbing"]}),
                new Field("frequentation"),
                new Field("glacier_rating", {activities:["mountain_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]}),
                new Field("global_rating", {activities:["mountain_climbing", "rock_climbing", "snow_ice_mixed"]}),
                new Field("height_diff_difficulties", {activities:["mountain_climbing", "snow_ice_mixed"]}),
                new Field("height_diff_down"),
                new Field("height_diff_up"),
                new Field("hiking_rating", {activities:["hiking"]}),
                new Field("hut_status"),
                new Field("ice_rating", {activities:["ice_climbing"]}),
                new Field("labande_global_rating", {activities:["skitouring"]}),
                new Field("length_total"),
                new Field("lift_status"),
                new Field("mtb_down_rating", {activities:["mountain_biking"]}),
                new Field("mtb_up_rating", {activities:["mountain_biking"]}),
                new Field("partial_trip"),
                new Field("participant_count"),
                new Field("public_transport"),
                new Field("quality"),
                new Field("rock_free_rating", {activities:["rock_climbing"]}),
                new Field("ski_rating", {activities:["skitouring"]}),
                new Field("snow_quality", {activities:["ice_climbing", "mountain_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]}),
                new Field("snow_quantity", {activities:["ice_climbing", "mountain_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]}),
                new Field("snowshoe_rating", {activities:["snowshoeing"]}),
                new Field("via_ferrata_rating", {activities:["via_ferrata"]}),
            )
        },

        profile:{
            letter:"u",
            localeFields:getFieldsObject(
                new Field("title"),
                new Field("summary"),
                new Field("description"),
            ),
            fields:getFieldsObject(
                new Field("activities"),
                new Field("categories"),
                new Field("name"),
            )
        },

        waypoint:{
            letter:"w",
            localeFields:getFieldsObject(
                new Field("title"),
                new Field("summary"),
                new Field("description"),
                new Field("access", {waypoint_types:["access", "climbing_indoor", "climbing_outdoor", "hut", "local_product", "slackline_spot"]}),
                new Field("access_period", {waypoint_types:["access", "camp_site", "climbing_outdoor", "gite", "hut", "local_product"]}),
            ),
            fields:getFieldsObject(
                new Field("access_time", {waypoint_types:["climbing_outdoor", "slackline_spot"]}),
                new Field("best_periods", {waypoint_types:["climbing_outdoor", "slackline_spot"]}),
                new Field("blanket_unstaffed", {waypoint_types:["hut", "shelter"]}),
                new Field("capacity", {waypoint_types:["bivouac", "camp_site", "gite", "hut", "shelter"]}),
                new Field("capacity_staffed", {waypoint_types:["camp_site", "gite", "hut"]}),
                new Field("children_proof", {waypoint_types:["climbing_outdoor"]}),
                new Field("climbing_indoor_types", {waypoint_types:["climbing_indoor"]}),
                new Field("climbing_outdoor_types", {waypoint_types:["climbing_outdoor"]}),
                new Field("climbing_rating_max", {waypoint_types:["climbing_indoor", "climbing_outdoor"]}),
                new Field("climbing_rating_median", {waypoint_types:["climbing_indoor", "climbing_outdoor"]}),
                new Field("climbing_rating_min", {waypoint_types:["climbing_indoor", "climbing_outdoor"]}),
                new Field("climbing_styles", {waypoint_types:["climbing_indoor", "climbing_outdoor"]}),
                new Field("custodianship", {waypoint_types:["camp_site", "gite", "hut"]}),
                new Field("elevation"),
                new Field("elevation_min", {waypoint_types:["access"]}),
                new Field("equipment_ratings", {waypoint_types:["climbing_outdoor"]}),
                new Field("exposition_rating", {waypoint_types:["paragliding_landing", "paragliding_takeoff"]}),
                new Field("gas_unstaffed", {waypoint_types:["hut", "shelter"]}),
                new Field("ground_types", {waypoint_types:["paragliding_landing", "paragliding_takeoff"]}),
                new Field("heating_unstaffed", {waypoint_types:["hut", "shelter"]}),
                new Field("height_max", {waypoint_types:["climbing_indoor", "climbing_outdoor"]}),
                new Field("height_median", {waypoint_types:["climbing_indoor", "climbing_outdoor"]}),
                new Field("height_min", {waypoint_types:["climbing_indoor", "climbing_outdoor"]}),
                new Field("length", {waypoint_types:["paragliding_landing", "paragliding_takeoff"]}),
                new Field("lift_access", {waypoint_types:["access"]}),
                new Field("maps_info"),
                new Field("matress_unstaffed", {waypoint_types:["hut", "shelter"]}),
                new Field("orientations", {waypoint_types:["climbing_outdoor", "paragliding_landing", "paragliding_takeoff", "slackline_spot"]}),
                new Field("paragliding_rating", {waypoint_types:["paragliding_landing", "paragliding_takeoff"]}),
                new Field("parking_fee", {waypoint_types:["access"]}),
                new Field("phone", {waypoint_types:["camp_site", "climbing_indoor", "gite", "hut", "local_product"]}),
                new Field("phone_custodian", {waypoint_types:["camp_site", "gite", "hut"]}),
                new Field("product_types", {waypoint_types:["local_product"]}),
                new Field("prominence", {waypoint_types:["summit"]}),
                new Field("public_transportation_rating", {waypoint_types:["access"]}),
                new Field("public_transportation_types", {waypoint_types:["access"]}),
                new Field("quality"),
                new Field("rain_proof", {waypoint_types:["climbing_outdoor"]}),
                new Field("rock_types", {waypoint_types:["climbing_outdoor"]}),
                new Field("routes_quantity", {waypoint_types:["climbing_indoor", "climbing_outdoor"]}),
                new Field("slackline_length_max", {waypoint_types:["slackline_spot"]}),
                new Field("slackline_length_min", {waypoint_types:["slackline_spot"]}),
                new Field("slackline_types", {waypoint_types:["slackline_spot"]}),
                new Field("slope", {waypoint_types:["paragliding_landing", "paragliding_takeoff"]}),
                new Field("snow_clearance_rating", {waypoint_types:["access"]}),
                new Field("url", {waypoint_types:["camp_site", "climbing_indoor", "climbing_outdoor", "gite", "hut", "local_product", "weather_station", "webcam"]}),
                new Field("waypoint_type"),
            )
        },

        xreport:{
            letter:"x",
            localeFields:getFieldsObject(
                new Field("title"),
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
                new Field("modifications"),
                new Field("other_comments"),
            ),
            fields:getFieldsObject(
                new Field("elevation"),
                new Field("date"),
                new Field("event_type"),
                new Field("activities"),
                new Field("nb_participants"),
                new Field("nb_impacted"),
                new Field("rescue"),
                new Field("avalanche_level"),
                new Field("avalanche_slope"),
                new Field("severity"),
                new Field("author_status"),
                new Field("activity_rate"),
                new Field("nb_outings"),
                new Field("age"),
                new Field("gender"),
                new Field("previous_injuries"),
                new Field("autonomy"),
                new Field("disable_comments"),
                new Field("anonymous"),
                new Field("quality"),
            )
        },

        image:{
            letter:"i",
            localeFields:getFieldsObject(
                new Field("title"),
                new Field("summary"),
                new Field("description"),
            ),
            fields:getFieldsObject(
                new Field("activities"),
                new Field("categories"),
                new Field("image_type"),
                new Field("author"),
                new Field("elevation"),
                new Field("height"),
                new Field("width"),
                new Field("file_size"),
                new Field("filename"),
                new Field("camera_name"),
                new Field("exposure_time"),
                new Field("focal_length"),
                new Field("fnumber"),
                new Field("iso_speed"),
                new Field("quality"),
            )
        },
    };

    this.documentTypes = Object.keys(this.objectDefinitions)

    this.letterToType = {}
    for(let type of this.documentTypes){
        this.letterToType[this.objectDefinitions[type].letter] = type
    }
}

Constants.prototype.getDocumentType = function(type){
    return type.length == 1 ? this.letterToType[type] : type
}

Constants.prototype.hasField = function (document, field){
    if(field.activities){
        for(let activity of field.activities){
            if(document.activities.indexOf(activity) != -1){
                return true;
            }
        }

        return false;
    }

    return true;
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

            if(subCategories.length == common.attributes.waypoint_types.length && propertyName=="waypoint_types")
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
