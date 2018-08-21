<template>
    <div>

        <edit-section header="Comments">
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.title"/>

            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.summary"/>
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.route_history"/>
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.description"/>
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.slackline_anchor1"/>
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.slackline_anchor2"/>
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.remarks"/>
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.gear"/>
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.external_resources"/>

        </edit-section>

        <edit-section header="Route">
            <input-activities class="is-6" :document="document" :field="fields.activities"/>
            <input-checkboxes class="is-6" :document="document" :field="fields.route_types"/>

            <input-base class="is-4" :document="document" :field="fields.main_waypoint_id"/>
            <input-base class="is-4" :document="document" :field="fields.slackline_type"/>
            <input-base class="is-4" :document="document" :field="fields.glacier_gear"/>
            <input-base class="is-4" :document="document" :field="fields.climbing_outdoor_type"/>
            <input-base class="is-4" :document="document" :field="fields.durations"/>
        </edit-section>

        <edit-section header="Terrain">
            <input-base class="is-4" :document="document" :field="fields.slackline_height"/>
            <input-base class="is-4" :document="document" :field="fields.lift_access"/>
            <input-base class="is-4" :document="document" :field="fields.height_diff_access"/>
            <input-base class="is-4" :document="document" :field="fields.height_diff_difficulties"/>
            <input-base class="is-4" :document="document" :field="fields.height_diff_down"/>
            <input-base class="is-4" :document="document" :field="fields.height_diff_up"/>
            <input-base class="is-4" :document="document" :field="fields.mtb_height_diff_portages"/>
            <input-base class="is-4" :document="document" :field="fields.mtb_length_asphalt"/>
            <input-base class="is-4" :document="document" :field="fields.mtb_length_trail"/>
            <input-base class="is-4" :document="document" :field="fields.route_length"/>
            <input-base class="is-4" :document="document" :field="fields.orientations"/>
            <input-checkboxes class="is-4" :document="document" :field="fields.rock_types"/>
            <input-checkboxes class="is-4" :document="document" :field="fields.configuration"/>
            <input-base class="is-4" :document="document" :field="fields.difficulties_height"/>
            <input-base class="is-4" :document="document" :field="fields.elevation_max"/>
            <input-base class="is-4" :document="document" :field="fields.elevation_min"/>
        </edit-section>

        <edit-section header="Ratings">
            <input-base class="is-3" :document="document" :field="fields.aid_rating"/>
            <input-base class="is-3" :document="document" :field="fields.hiking_mtb_exposition"/>
            <input-base class="is-3" :document="document" :field="fields.ski_exposition"/>
            <input-base class="is-3" :document="document" :field="fields.mixed_rating"/>
            <input-base class="is-3" :document="document" :field="fields.global_rating"/>
            <input-base class="is-3" :document="document" :field="fields.hiking_rating"/>
            <input-base class="is-3" :document="document" :field="fields.ice_rating"/>
            <input-base class="is-3" :document="document" :field="fields.labande_global_rating"/>
            <input-base class="is-3" :document="document" :field="fields.labande_ski_rating"/>
            <input-base class="is-3" :document="document" :field="fields.mtb_down_rating"/>
            <input-base class="is-3" :document="document" :field="fields.risk_rating"/>
            <input-base class="is-3" :document="document" :field="fields.rock_free_rating"/>
            <input-base class="is-3" :document="document" :field="fields.rock_required_rating"/>
            <input-base class="is-3" :document="document" :field="fields.snowshoe_rating"/>
            <input-base class="is-3" :document="document" :field="fields.via_ferrata_rating"/>
            <input-base class="is-3" :document="document" :field="fields.ski_rating"/>
            <input-base class="is-3" :document="document" :field="fields.mtb_up_rating"/>
            <input-base class="is-3" :document="document" :field="fields.engagement_rating"/>
            <input-base class="is-3" :document="document" :field="fields.equipment_rating"/>
            <input-base class="is-3" :document="document" :field="fields.exposition_rock_rating"/>

        </edit-section>

    </div>
</template>

<script>

    import TabView from './utils/TabView'
    import TabItem from './utils/TabItem'

    import EditSection from './utils/EditSection'

    import InputBase from './utils/InputBase'
    import InputCheckboxes from './utils/InputCheckboxes'
    import InputActivities from './utils/InputActivities'

    export default {
        components:{
            TabView,
            TabItem,
            InputBase,
            InputCheckboxes,
            InputActivities,
            EditSection,
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
