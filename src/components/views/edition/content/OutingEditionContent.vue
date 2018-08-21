<template>
    <div>

        <edit-section header="general information">
            <input-base class="is-6" :document="document" :field="fields.date_start" />
            <input-base class="is-6" :document="document" :field="fields.date_end" />
            <!-- todo : one day trip -->

            <input-activities class="is-12" :document="document"/>
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.route_description"/>
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.timing"/>

            <input-base class="is-4" :document="document" :field="fields.partial_trip" />
            <input-base class="is-4" :document="document" :field="fields.length_total" />
            <input-base class="is-4" :document="document" :field="fields.elevation_min" />
            <input-base class="is-4" :document="document" :field="fields.elevation_max" />
            <input-base class="is-4" :document="document" :field="fields.height_diff_up" />
            <input-base class="is-4" :document="document" :field="fields.height_diff_down" />
            <input-base class="is-4" :document="document" :field="fields.ski_rating" />
            <input-base class="is-4" :document="document" :field="fields.labande_global_rating" />
            <input-base class="is-4" :document="document" :field="fields.snowshoe_rating" />
            <input-base class="is-4" :document="document" :field="fields.global_rating" />
            <input-base class="is-4" :document="document" :field="fields.engagement_rating" />
            <input-base class="is-4" :document="document" :field="fields.equipment_rating" />
            <input-base class="is-4" :document="document" :field="fields.ice_rating" />
            <input-base class="is-4" :document="document" :field="fields.via_ferrata_rating" />
            <input-base class="is-4" :document="document" :field="fields.hiking_rating" />
            <input-base class="is-4" :document="document" :field="fields.mtb_down_rating" />
            <input-base class="is-4" :document="document" :field="fields.mtb_up_rating" />
            <input-base class="is-4" :document="document" :field="fields.rock_free_rating" />
            <input-base class="is-4" :document="document" :field="fields.height_diff_difficulties" />
        </edit-section>

        <edit-section header="Weather &amp; conditions">

            <input-base class="is-6" :document="document" :base="locale" :field="localeFields.weather"/>
            <input-base class="is-6" :document="document" :base="locale" :field="localeFields.conditions"/>
            <!-- todo
            <input-base :document="document" :base="locale" :field="localeFields.conditions_levels"/>
            -->

            <input-base class="is-4" :document="document" :field="fields.condition_rating" />
            <input-base class="is-4" :document="document" :field="fields.elevation_up_snow" />
            <input-base class="is-4" :document="document" :field="fields.elevation_down_snow" />
            <input-base class="is-4" :document="document" :field="fields.snow_quantity" />
            <input-base class="is-4" :document="document" :field="fields.snow_quality" />
            <input-base class="is-4" :document="document" :field="fields.glacier_rating" />
            <input-checkboxes class="is-12" :document="document" :field="fields.avalanche_signs" />
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.avalanches"/>
        </edit-section>

        <edit-section header="road or PT access &amp; hut">
            <input-base class="is-4" :document="document" :field="fields.public_transport" />
            <input-base class="is-4" :document="document" :field="fields.frequentation" />
            <input-base class="is-4" :document="document" :field="fields.lift_status" />
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.hut_comment"/>
            <input-base class="is-4" :document="document" :field="fields.hut_status" />
            <input-base class="is-4" :document="document" :field="fields.elevation_access" />
            <input-base class="is-4" :document="document" :field="fields.access_condition" />
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.access_comment"/>
        </edit-section>

        <edit-section header="comments">
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.title"/>
            <input-base class="is-8" :document="document" :base="locale" :field="localeFields.participants"/>
            <input-base class="is-4" :document="document" :field="fields.participant_count" />
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.description"/>
            <input-base class="is-4" :document="document" :field="fields.disable_comments" />
        </edit-section>

        <!-- todo where is that ??
            <input-base :document="document" :base="locale" :field="localeFields.summary"/>
        -->

    </div>
</template>

<script>

    import TabView from './utils/TabView'
    import TabItem from './utils/TabItem'

    import InputBase from './utils/InputBase'
    import InputActivities from './utils/InputActivities'
    import InputCheckboxes from './utils/InputCheckboxes'
    import EditSection from './utils/EditSection'

    export default {
        components:{
            TabView,
            TabItem,
            InputBase,
            InputActivities,
            InputCheckboxes,
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
