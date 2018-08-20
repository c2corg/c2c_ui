<template>
    <div>

        <edit-section header="general information">
            <div class="columns">
                <div class="column">
                    <input-base :document="document" :field="fields.date_start" />
                </div>
                <div class="column">
                    <!-- todo : one day trip -->
                    <input-base :document="document" :field="fields.date_end" />
                </div>
            </div>

            <input-activities :document="document"/>

            <input-base :document="document" :base="locale" :field="localeFields.route_description"/>
            <input-base :document="document" :base="locale" :field="localeFields.timing"/>

            <div class="columns is-multiline">
                <div class="column is-4">
                    <input-base :document="document" :field="fields.partial_trip" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.length_total" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.elevation_min" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.elevation_max" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.height_diff_up" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.height_diff_down" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.ski_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.labande_global_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.snowshoe_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.global_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.engagement_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.equipment_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.ice_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.via_ferrata_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.hiking_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.mtb_down_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.mtb_up_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.rock_free_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.height_diff_difficulties" />
                </div>
            </div>
        </edit-section>

        <edit-section header="Weather &amp; conditions">



            <div class="columns is-multiline">

                <div class="column is-6">
                    <input-base :document="document" :base="locale" :field="localeFields.weather"/>
                </div>
                <div class="column is-6">
                    <input-base :document="document" :base="locale" :field="localeFields.conditions"/>
                </div>
                    <!-- todo
                    <input-base :document="document" :base="locale" :field="localeFields.conditions_levels"/>
                -->

                <div class="column is-4">
                    <input-base :document="document" :field="fields.condition_rating" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.elevation_up_snow" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.elevation_down_snow" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.snow_quantity" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.snow_quality" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.glacier_rating" />
                </div>
                <div class="column is-12">
                    <input-checkboxes :document="document" :field="fields.avalanche_signs" />
                </div>
                <div class="column is-12">
                    <input-base :document="document" :base="locale" :field="localeFields.avalanches"/>
                </div>
            </div>
        </edit-section>

        <edit-section header="road or PT access &amp; hut">
            <div class="columns is-multiline">
                <div class="column is-4">
                    <input-base :document="document" :field="fields.public_transport" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.frequentation" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.lift_status" />
                </div>
                <div class="column is-12">
                    <input-base :document="document" :base="locale" :field="localeFields.hut_comment"/>
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.hut_status" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.elevation_access" />
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.access_condition" />
                </div>
                <div class="column is-12">
                    <input-base :document="document" :base="locale" :field="localeFields.access_comment"/>
                </div>
            </div>
        </edit-section>

        <edit-section header="comments">
            <div class="columns is-multiline">
                <div class="column is-12">
                    <input-base :document="document" :base="locale" :field="localeFields.title"/>
                </div>
                <div class="column is-8">
                    <input-base :document="document" :base="locale" :field="localeFields.participants"/>
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.participant_count" />
                </div>
                <div class="column is-12">
                    <input-base :document="document" :base="locale" :field="localeFields.description"/>
                </div>
                <div class="column is-4">
                    <input-base :document="document" :field="fields.disable_comments" />
                </div>
            </div>
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
