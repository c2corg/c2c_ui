
import common from '@/js/common.js'

function Field(name, properties){
    var fields = {
        //locales' fields
        title: {isRawText:true},
        external_resources : {label:"External resources"},
        route_history : {label:"History"},
        slope : {isRawText:true},

        // document's fields
        activities:{values:common.attributes.activities},
        climbing_outdoor_typ:{values:common.attributes.climbing_outdoor_types},
        configuration:{values:common.attributes.route_configuration_types},
        glacier_gear:{values:common.attributes.glacier_gear_types},
        quality:{values:common.attributes.quality_types},
        rock_types:{values:common.attributes.rock_types},
        route_types:{values:common.attributes.route_types},
        slackline_type:{values:common.attributes.slackline_types},

        difficulties_height:{type:"number", min:0, unit:"m"},
        elevation_max:{type:"number", min:0, unit:"m"},
        elevation_min:{type:"number", min:0, unit:"m"},
        height_diff_access:{type:"number", min:0, unit:"m"},
        height_diff_difficulties:{type:"number", min:0, unit:"m"},
        height_diff_down:{type:"number", min:0, unit:"m"},
        height_diff_up:{type:"number", min:0, unit:"m"},
        mtb_length_asphalt:{type:"number", min:0, unit:"km"},
        mtb_length_trail:{type:"number", min:0, unit:"km"},
        mtb_height_diff_portages:{type:"number", min:0, unit:"km"},
        route_length:{type:"number", min:0, unit:"km"},
        slackline_height:{type:"number", min:0, unit:"km"},

        aid_rating:{values:common.attributes.aid_ratings},
        engagement_rating:{values:common.attributes.engagement_ratings},
        equipment_rating:{values:common.attributes.equipment_ratings},
        exposition_rock_rating:{values:common.attributes.exposition_rock_ratings},
        hiking_mtb_exposition:{values:common.attributes.exposition_ratings},
        hiking_rating:{values:common.attributes.hiking_ratings},
        ice_rating:{values:common.attributes.ice_ratings},
        labande_global_rating:{values:common.attributes.global_ratings},
        labande_ski_rating:{values:common.attributes.labande_ski_ratings},
        global_rating:{values:common.attributes.global_ratings},
        mixed_rating:{values:common.attributes.mixed_ratings},
        mtb_down_rating:{values:common.attributes.mtb_down_ratings},
        risk_rating:{values:common.attributes.risk_ratings},
        rock_free_rating:{values:common.attributes.climbing_ratings},
        rock_required_rating:{values:common.attributes.climbing_ratings},
        snowshoe_rating:{values:common.attributes.snowshoe_ratings},
        via_ferrata_rating:{values:common.attributes.via_ferrata_ratings},
        ski_exposition:{values:common.attributes.exposition_ratings},
        ski_rating:{values:common.attributes.ski_ratings},
        mtb_up_rating:{values:common.attributes.mtb_up_ratings},
    }

    var def = fields[name] || {}

    this.name = name

    for(let key of Object.keys(def)){
        this[key] = def[key]
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

    this.letterToType = {
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

    this.documentsGeoLocalization = [
        "routes",
        "waypoints",
        "profiles",
        "outings",
        "images",
        "xreports"
    ]

    this.documentTypes = Object.values(this.letterToType)

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
                new Field("slope"),
                new Field("external_resources"),
            ),
            fields:getFieldsObject(
                new Field("activities"),
                new Field("aid_rating", {activities:["rock_climbing", "mountain_climbing"]}),
                new Field("climbing_outdoor_typ", {activities:["rock_climbing"]}),
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
            localeFields:getFieldsObject(
                new Field("title"),
            ),
            fields:getFieldsObject(
                new Field("area_type"),
                new Field("quality"),
            )
        },

        article:{
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
            localeFields:getFieldsObject(
                new Field("title"),
                new Field("summary"),
                new Field("description"),
                new Field("participants"),
                new Field("access_comment"),
                new Field("weather"),
                new Field("timing"),
                new Field("conditions_levels"),
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
                new Field("geometry.geom"),
                new Field("geometry.geom_detail"),
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
            localeFields:getFieldsObject(
                new Field("title"),
                new Field("summary"),
                new Field("description"),
            ),
            fields:getFieldsObject(
                new Field("activities"),
                new Field("categories"),
            )
        },

        waypoint:{
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
                new Field("geometry.geom"),
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
            )
        },

        xreport:{
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
