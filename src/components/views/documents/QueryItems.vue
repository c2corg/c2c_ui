<template>
    <div>

        <dropdown-button v-for="key of Object.keys(categorizedFields)" :key="key"
            :label="key"  @changeDisplay="refreshSliders()">
            <div class="sub-query-items">
                <query-item v-for="field of categorizedFields[key]" :key="field.name" :field="field"></query-item>
            </div>
        </dropdown-button>
        
    </div>
</template>

<script>
    import constants from '@/js/constants.js'
    import QueryItem from './QueryItem'

    const categorizedFields = {
        General : [
            "activities",
            "article_type",
            "area_type",
            "book_types",
            "waypoint_type",
            "event_type",
        ],

        Ratings:[
            "condition_rating",
            "global_rating",
            "rock_free_rating",
            "rock_required_rating",
            "aid_rating",
            "engagement_rating",
            "risk_rating",
            "equipment_rating",
            "exposition_rock_rating",
            "ice_rating",
            "mixed_rating",
            "ski_rating",
            "hiking_rating",
            "ski_exposition",
            "labande_global_rating",
            "labande_ski_rating",
            "mixed_rating",
            "snowshoe_rating",
            "via_ferrata_rating",
            "mtb_down_rating",
            "mtb_up_rating",
            "hiking_mtb_exposition",
            "glacier_rating",
            "equipment_ratings",
            "exposition_rating",
            "public_transportation_rating",
            "climbing_rating_max",
            "climbing_rating_median",
            "climbing_rating_min",
            "paragliding_rating",
            "snow_clearance_rating",
        ],

        Terrain:[
            "orientations",
            "elevation_max",
            "elevation_min",
            "configuration",
            "difficulties_height",
            "climbing_outdoor_type",
            "height_diff_access",
            "height_diff_difficulties",
            "height_diff_down",
            "height_diff_up",
            "mtb_height_diff_portages",
            "mtb_length_asphalt",
            "mtb_length_trail",
            "rock_types",
            "route_length",
            "slackline_type",
            "snow_quality",
            "snow_quantity",
            "avalanche_signs",
            "elevation_access",
            "elevation_down_snow",
            "elevation_up_snow",
            "children_proof",
            "lift_access",
            "prominence",
            "climbing_indoor_types",
            "climbing_outdoor_types",
            "climbing_styles",
            "elevation",
            "height_max",
            "height_median",
            "height_min",
            "length",
            "rain_proof",
            "routes_quantity",
            "route_types",
        ],
        Miscs:[
            "title",
            "lang",
            "durations",
            "glacier_gear",
            "quality",
            "categories",
            "frequentation",
            "length_total",
            "public_transport",
            "access_time",
            "best_periods",
            "capacity",
            "capacity_staffed",
            "custodianship",
            "product_types",
            "public_transportation_types",
            "weather_station_types",
            "nb_participants",
            "nb_impacted",
            "severity",
        ]
    }

    export default {
        components:{
            QueryItem
        },

        computed:{
            urlActivities(){
                return (this.$route.query.act || '').split(",")
            },

            urlWaypoint_types(){
                return (this.$route.query.wtyp || '').split(",")
            },

            fields(){
                return constants.objectDefinitions[this.type].fields
            },

            type() {
                return this.$route.name.slice(0, -1)
            },

            categorizedFields(){
                var result = {}
                var urlFilter = {
                    activities:this.urlActivities,
                    waypoint_types:this.urlWaypoint_types,
                }

                for(let key of Object.keys(categorizedFields)){
                    let temp = []
                    for(let name of categorizedFields[key]){
                        let field = this.fields[name]
                        if(field && field.isVisibleFor(urlFilter)){
                            temp.push(field)
                        }
                    }
                    if(temp.length != 0)
                        result[key] = temp
                }

                return result
            }
        },
/* this function will check that we hav'nt forgotten a field
        mounted(){
            var fields = []

            for(let dropdown of this.$children){
                for(let queryItem of dropdown.$children){
                    if(queryItem.field){
                        fields.push(queryItem.field)
                    }
                }
            }

            for(let field of Object.values(this.fields)){
                if(field.url && !fields.includes(field))
                    console.log('<query-item :field="fields.' + field.name + '"></query-item>')
            }
        },
*/
        methods:{
            refreshSliders(){
                for(let dropdown of this.$children){
                    if(dropdown.isActive){
                        for(let queryItem of dropdown.$children){
                            queryItem.refreshSlider()
                        }
                    }
                }
            }
        }
    }
</script>

<style scoped>

    .sub-query-items{
        width:300px
    }

</style>
