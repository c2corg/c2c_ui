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
                <input-markdown :document="document" :locale="locale" :field="localeFields.route_history"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.description"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.slackline_anchor1"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.slackline_anchor2"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.remarks"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.gear"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.external_resources"/>

            </tab-item>

            <tab-item title="Route">
                <input-base :document="document" :field="fields.activities"/>
                <input-base :document="document" :field="fields.main_waypoint_id"/>
                <input-base :document="document" :field="fields.route_types"/>
                <input-base :document="document" :field="fields.slackline_type"/>
                <input-base :document="document" :field="fields.quality"/>
                <input-base :document="document" :field="fields.glacier_gear"/>
                <input-base :document="document" :field="fields.climbing_outdoor_typ"/>
                <input-base :document="document" :field="fields.durations"/>
            </tab-item>

            <tab-item title="Terrain">
                <input-base :document="document" :field="fields.slackline_height"/>
                <input-base :document="document" :field="fields.lift_access"/>
                <input-base :document="document" :field="fields.height_diff_access"/>
                <input-base :document="document" :field="fields.height_diff_difficulties"/>
                <input-base :document="document" :field="fields.height_diff_down"/>
                <input-base :document="document" :field="fields.height_diff_up"/>
                <input-base :document="document" :field="fields.mtb_height_diff_portages"/>
                <input-base :document="document" :field="fields.mtb_length_asphalt"/>
                <input-base :document="document" :field="fields.mtb_length_trail"/>
                <input-base :document="document" :field="fields.route_length"/>
                <input-base :document="document" :field="fields.orientations"/>
                <input-base :document="document" :field="fields.rock_types"/>
                <input-base :document="document" :field="fields.configuration"/>
                <input-base :document="document" :field="fields.difficulties_height"/>
                <input-base :document="document" :field="fields.elevation_max"/>
                <input-base :document="document" :field="fields.elevation_min"/>
            </tab-item>

            <tab-item title="Ratings">
                <input-base :document="document" :field="fields.aid_rating"/>
                <input-base :document="document" :field="fields.hiking_mtb_exposition"/>
                <input-base :document="document" :field="fields.ski_exposition"/>
                <input-base :document="document" :field="fields.mixed_rating"/>
                <input-base :document="document" :field="fields.global_rating"/>
                <input-base :document="document" :field="fields.hiking_rating"/>
                <input-base :document="document" :field="fields.ice_rating"/>
                <input-base :document="document" :field="fields.labande_global_rating"/>
                <input-base :document="document" :field="fields.labande_ski_rating"/>
                <input-base :document="document" :field="fields.mtb_down_rating"/>
                <input-base :document="document" :field="fields.risk_rating"/>
                <input-base :document="document" :field="fields.rock_free_rating"/>
                <input-base :document="document" :field="fields.rock_required_rating"/>
                <input-base :document="document" :field="fields.snowshoe_rating"/>
                <input-base :document="document" :field="fields.via_ferrata_rating"/>
                <input-base :document="document" :field="fields.ski_rating"/>
                <input-base :document="document" :field="fields.mtb_up_rating"/>
                <input-base :document="document" :field="fields.engagement_rating"/>
                <input-base :document="document" :field="fields.equipment_rating"/>
                <input-base :document="document" :field="fields.exposition_rock_rating"/>

            </tab-item>


        </tab-view>
    </div>
</template>

<script>

    import TabView from './../utils/TabView'
    import TabItem from './../utils/TabItem'

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
