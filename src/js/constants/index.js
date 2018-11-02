import common from './common.js'
import Field from './field.js'

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
const snow_activities = ["ice_climbing", "mountain_climbing", "skitouring", "snow_ice_mixed", "snowshoeing"]
const avalanche_activities = ["ice_climbing", "skitouring", "snowshoeing", "snow_ice_mixed"]

const getFieldsObject  = function(){
    var result = {}

    for(let item of arguments){
        result[item.name] = item
    }

    return result
}

function Constants(){
    this.activities = common.attributes.activities

    this.langs = common.attributes.langs

    // You can find associations in
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

                new Field("articles", {url:"c"}),
                new Field("books", {url:"b"}),
                new Field("outings", {url:"o"}),
                new Field("routes", {url:"r"}),
                new Field("waypoints", {url:"w"}),
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

                new Field("articles", {url:"c"}),
                new Field("routes", {url:"r"}),
                new Field("waypoints", {url:"w"}),
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

                new Field("articles", {url:"c"}),
                new Field("books", {url:"b"}),
                new Field("routes", {url:"r"}),
                new Field("waypoints", {url:"w"}),
            ),
            validAssociations:["waypoint", "route", "book", "article"],
        },

        map:{
            letter:"m",
            fields:getFieldsObject(
                new Field("title", {url:"q"}),
                new Field("summary"),
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
                new Field("avalanches", {activities:avalanche_activities}),
                new Field("lang", {url:"l"}),

                new Field("access_condition"),
                new Field("activities", {url:"act", required:true}),
                new Field("avalanche_signs", {url:"avdate", activities:avalanche_activities}),
                new Field("condition_rating", {url:"ocond"}),
                new Field("date_end"),
                new Field("date_start"),
                new Field("disable_comments"),
                new Field("elevation_access", {url:"oparka"}),
                new Field("elevation_down_snow", {url:"swld", activities:snow_activities}),
                new Field("elevation_max", {url:"oalt"}),
                new Field("elevation_min"),
                new Field("elevation_up_snow", {url:"swlu", activities:snow_activities}),
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
                new Field("snow_quality", {url:"swqual", activities:snow_activities}),
                new Field("snow_quantity", {url:"swquan", activities:snow_activities}),
                new Field("snowshoe_rating", {url:"wrat", activities:["snowshoeing"]}),
                new Field("via_ferrata_rating", {url:"krat", activities:["via_ferrata"]}),

                // associations
                new Field("articles", {url:"c"}),
                new Field("routes", {url:"r", required:true}),
                new Field("users", {url:"u", required:true}),
                new Field("xreports", {url:"x"}),
            ),
            validAssociations:["article", "route", "xreport", "profile"],
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

                // associations
                new Field("articles", {url:"c"}),
                new Field("books", {url:"b"}),
                new Field("routes", {url:"r"}),
                new Field("waypoints", {url:"w"}),
                new Field("xreports", {url:"x"}),
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

                // associations
                new Field("articles", {url:"c"}),
                new Field("books", {url:"b"}),
                new Field("waypoints", {url:"w"}),
                new Field("xreports", {url:"x"}),
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

                // associations
                new Field("articles", {url:"c"}),
                new Field("outings", {url:"o"}),
                new Field("routes", {url:"r"}),
            ),

            validAssociations:["route", "outing", "article"],
        },
    }

    this.documentTypes = Object.keys(this.objectDefinitions)

    this.letterToDocumentType = {}
    for(let documentType of this.documentTypes){
        let definition = this.objectDefinitions[documentType]

        this.letterToDocumentType[definition.letter] = documentType
        definition.documentType = documentType // TODO rename definition.type to definition.documentType

        // Let's build objectDefinitions.<type>.validAssociations
        // it's an array of string, transform it to an object of
        // <string, definition>
        let validAssociations = {}

        for(let documentType of definition.validAssociations){
            validAssociations[documentType] = this.objectDefinitions[documentType]
        }

        definition.validAssociations = validAssociations
    }
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
