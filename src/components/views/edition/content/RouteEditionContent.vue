<template>
    <div>
        <edit-section header="general informations">
            <input-base :document="document" :base="locale" :field="fields.title" class="is-12"/>
            <input-base :document="document" :field="fields.main_waypoint_id" class="is-4"/>
        </edit-section>

        <edit-section header="Activities">
            <input-activities :document="document" :field="fields.activities" class="is-12"/>
            <input-base :document="document" :field="fields.climbing_outdoor_type" class="is-4"/>
        </edit-section>

        <edit-section header="Slacklining">
            <input-base :document="document" :field="fields.slackline_type" class="is-4"/>
            <input-base :document="document" :field="fields.route_length" class="is-4"/>
            <input-base :document="document" :field="fields.slackline_height" class="is-4"/>
        </edit-section>

        <edit-section header="configuration">

            <input-base :document="document" :field="fields.orientations" class="is-4"/>
            <input-checkboxes :document="document" :field="fields.route_types" class="is-4"/>
            <input-checkboxes :document="document" :field="fields.configuration" class="is-4"/>
            <input-checkboxes :document="document" :field="fields.rock_types" class="is-12"/>
        </edit-section>

        <edit-section header="Caracteristics">
            <input-base :document="document" :field="fields.elevation_min" class="is-4"/>
            <input-base :document="document" :field="fields.elevation_max" class="is-4"/>
            <input-base :document="document" :field="fields.height_diff_up" class="is-4"/>
            <input-base :document="document" :field="fields.height_diff_down" class="is-4"/>
            <input-base :document="document" :field="fields.height_diff_access" class="is-4"/>
            <input-base :document="document" :field="fields.height_diff_difficulties" class="is-4"/>
            <input-base :document="document" :field="fields.difficulties_height" class="is-4"/>
            <input-base :document="document" :field="fields.route_length" class="is-4"/>
            <input-base :document="document" :field="fields.mtb_length_asphalt" class="is-4"/>
            <input-base :document="document" :field="fields.mtb_length_trail" class="is-4"/>
            <input-base :document="document" :field="fields.mtb_height_diff_portages" class="is-4"/>
            <input-checkboxes :document="document" :field="fields.durations" class="is-4"/>
            <input-base :document="document" :field="fields.lift_access" class="is-4"/>
        </edit-section>

        <edit-section header="Ratings">
            <input-base :document="document" :field="fields.labande_ski_rating" class="is-3"/>
            <input-base :document="document" :field="fields.ski_rating" class="is-3"/>
            <input-base :document="document" :field="fields.labande_global_rating" class="is-3"/>
            <input-base :document="document" :field="fields.snowshoe_rating" class="is-3"/>
            <input-base :document="document" :field="fields.global_rating" class="is-3"/>
            <input-base :document="document" :field="fields.engagement_rating" class="is-3"/>
            <input-base :document="document" :field="fields.equipment_rating" class="is-3"/>
            <input-base :document="document" :field="fields.ice_rating" class="is-3"/>
            <input-base :document="document" :field="fields.mixed_rating" class="is-3"/>
            <input-base :document="document" :field="fields.risk_rating" class="is-3"/>
            <input-base :document="document" :field="fields.via_ferrata_rating" class="is-3"/>
            <input-base :document="document" :field="fields.hiking_rating" class="is-3"/>
            <input-base :document="document" :field="fields.mtb_down_rating" class="is-3"/>
            <input-base :document="document" :field="fields.mtb_up_rating" class="is-3"/>
            <input-base :document="document" :field="fields.rock_free_rating" class="is-3"/>
            <input-base :document="document" :field="fields.exposition_rock_rating" class="is-3"/>
            <input-base :document="document" :field="fields.rock_required_rating" class="is-3"/>
            <input-base :document="document" :field="fields.aid_rating" class="is-3"/>
            <input-base :document="document" :field="fields.ski_exposition" class="is-3"/>
            <input-base :document="document" :field="fields.hiking_mtb_exposition" class="is-3"/>
            <!-- todo slope -->
        </edit-section>

        <edit-section header="Comments">
            <input-base :document="document" :base="locale" :field="fields.summary" class="is-12"/>
            <input-base :document="document" :base="locale" :field="fields.route_history" class="is-12"/>
            <input-base :document="document" :base="locale" :field="fields.description" class="is-12"/>
            <input-base :document="document" :base="locale" :field="fields.slackline_anchor1" class="is-12"/>
            <input-base :document="document" :base="locale" :field="fields.slackline_anchor2" class="is-12"/>
            <input-base :document="document" :base="locale" :field="fields.remarks" class="is-12"/>
            <input-base :document="document" :base="locale" :field="fields.gear" class="is-12"/>
            <input-base :document="document" :field="fields.glacier_gear" class="is-narrow"/>
            <input-base :document="document" :base="locale" :field="fields.external_resources" class="is-12"/>
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

        props : ["document", "locale", "fields"],
    }
</script>
