<template>
    <div>
        <tab-view>

            <tab-item title="Comments">
                <div class="field">
                      <div class="control">
                          <h2>Title</h2>
                          <input class="input is-primary" type="text" v-model="locale.title">
                      </div>
                </div>

                <input-markdown :document="document" :locale="locale" :field="localeFields.summary"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.description"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.access"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.access_period"/>

            </tab-item>

            <tab-item title="Waypoint">
                <input-base :document="document" :field="fields.access_time" />
                <input-base :document="document" :field="fields.best_periods" />
                <input-base :document="document" :field="fields.blanket_unstaffed" />
                <input-base :document="document" :field="fields.capacity" />
                <input-base :document="document" :field="fields.capacity_staffed" />
                <input-base :document="document" :field="fields.children_proof" />
                <input-base :document="document" :field="fields.climbing_indoor_types" />
                <input-base :document="document" :field="fields.climbing_outdoor_types" />
                <input-base :document="document" :field="fields.climbing_rating_max" />
                <input-base :document="document" :field="fields.climbing_rating_median" />
                <input-base :document="document" :field="fields.climbing_rating_min" />
                <input-base :document="document" :field="fields.climbing_styles" />
                <input-base :document="document" :field="fields.custodianship" />
                <input-base :document="document" :field="fields.elevation" />
                <input-base :document="document" :field="fields.elevation_min" />
                <input-base :document="document" :field="fields.equipment_ratings" />
                <input-base :document="document" :field="fields.exposition_rating" />
                <input-base :document="document" :field="fields.gas_unstaffed" />
                <input-base :document="document" :field="fields.ground_types" />
                <input-base :document="document" :field="fields.heating_unstaffed" />
                <input-base :document="document" :field="fields.height_max" />
                <input-base :document="document" :field="fields.height_median" />
                <input-base :document="document" :field="fields.height_min" />
                <input-base :document="document" :field="fields.length" />
                <input-base :document="document" :field="fields.lift_access" />
                <input-base :document="document" :field="fields.maps_info" />
                <input-base :document="document" :field="fields.matress_unstaffed" />
                <input-base :document="document" :field="fields.orientations" />
                <input-base :document="document" :field="fields.paragliding_rating" />
                <input-base :document="document" :field="fields.parking_fee" />
                <input-base :document="document" :field="fields.phone" />
                <input-base :document="document" :field="fields.phone_custodian" />
                <input-base :document="document" :field="fields.product_types" />
                <input-base :document="document" :field="fields.prominence" />
                <input-base :document="document" :field="fields.public_transportation_rating" />
                <input-base :document="document" :field="fields.public_transportation_types" />
                <input-base :document="document" :field="fields.quality" />
                <input-base :document="document" :field="fields.rain_proof" />
                <input-base :document="document" :field="fields.rock_types" />
                <input-base :document="document" :field="fields.routes_quantity" />
                <input-base :document="document" :field="fields.slackline_length_max" />
                <input-base :document="document" :field="fields.slackline_length_min" />
                <input-base :document="document" :field="fields.slackline_types" />
                <input-base :document="document" :field="fields.slope" />
                <input-base :document="document" :field="fields.snow_clearance_rating" />
                <input-base :document="document" :field="fields.url" />
                <input-base :document="document" :field="fields.waypoint_type" />

            </tab-item>

        </tab-view>
    </div>
</template>

<script>

    import TabView from './utils/TabView'
    import TabItem from './utils/TabItem'

    import InputBase from './utils/InputBase'
    import InputMarkdown from './utils/InputMarkdown'

    export default {
        components:{
            TabView,
            TabItem,
            InputBase,
            InputMarkdown,
        },

        props : ["document", "locale", "objectDefinition"],

        data(){
            return {
                fields : this.objectDefinition.fields,
                localeFields : this.objectDefinition.localeFields,
            }
        },
    }
</script>
